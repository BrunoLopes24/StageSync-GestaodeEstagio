import crypto from 'crypto';
import * as argon2 from 'argon2';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { AppError } from '../middleware/error-handler';
import { auditLog } from '../utils/audit-logger';

// ─── Constants ──────────────────────────────────────────

// Safe charset: uppercase alphanumeric excluding ambiguous O, 0, I, 1, L
const SAFE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 16;
const CODE_EXPIRY_DAYS = 30;

// ─── Helpers ────────────────────────────────────────────

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function generateSecureCode(): string {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += SAFE_CHARSET[bytes[i] % SAFE_CHARSET.length];
  }
  return code;
}

function constantTimeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid expiresIn format: ${expiresIn}`);
  const value = parseInt(match[1], 10);
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * multipliers[match[2]];
}

// ─── Student: Generate Invitation Code ──────────────────

export async function generateAccessCode(studentUserId: string): Promise<{ code: string; expiresAt: Date }> {
  // Deactivate any existing active codes for this student
  await prisma.professorAccess.updateMany({
    where: { studentId: studentUserId, isActive: true },
    data: { isActive: false },
  });

  const rawCode = generateSecureCode();
  const codeHash = hashCode(rawCode);
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.professorAccess.create({
    data: {
      studentId: studentUserId,
      codePlain: rawCode,
      codeHash,
      isActive: true,
      expiresAt,
    },
  });

  auditLog('PROFESSOR_CODE_GENERATED', { userId: studentUserId });

  return { code: rawCode, expiresAt };
}

// ─── Student: Get Active Code Status ────────────────────

export async function getActiveCodeStatus(studentUserId: string) {
  const record = await prisma.professorAccess.findFirst({
    where: { studentId: studentUserId, isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) return { hasActiveCode: false };

  // Legacy active codes created before code_plain support cannot be displayed.
  // Deactivate them and force generation of a new visible code.
  if (!record.codePlain) {
    await prisma.professorAccess.update({
      where: { id: record.id },
      data: { isActive: false },
    });
    return { hasActiveCode: false };
  }

  return {
    hasActiveCode: true,
    code: record.codePlain,
    expiresAt: record.expiresAt,
    createdAt: record.createdAt,
  };
}

// ─── Student: Revoke Active Unused Code ─────────────────

export async function revokeAccessCode(studentUserId: string): Promise<void> {
  await prisma.professorAccess.updateMany({
    where: { studentId: studentUserId, isActive: true },
    data: { isActive: false },
  });

  auditLog('PROFESSOR_CODE_REVOKED', { userId: studentUserId });
}

// ─── Student: Get Linked Professor Info ─────────────────

export async function getLinkedProfessor(studentUserId: string) {
  const link = await prisma.professorStudentLink.findFirst({
    where: { studentId: studentUserId, isActive: true },
    include: { professor: { select: { id: true, email: true } } },
  });

  if (!link) return null;

  return {
    professorId: link.professor.id,
    professorEmail: link.professor.email,
    linkedAt: link.createdAt,
  };
}

// ─── Student: Revoke Supervision Link ───────────────────

export async function revokeLink(studentUserId: string): Promise<void> {
  const result = await prisma.professorStudentLink.updateMany({
    where: { studentId: studentUserId, isActive: true },
    data: { isActive: false },
  });

  if (result.count > 0) {
    auditLog('PROFESSOR_LINK_REVOKED', { userId: studentUserId });
  }
}

// ─── Professor: Login via Email + Code (Transactional) ──

interface LoginContext {
  ip: string;
  userAgent: string;
}

export async function professorLogin(
  email: string,
  rawCode: string,
  context: LoginContext,
): Promise<{ accessToken: string; refreshToken: string; professorId: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const codeHash = hashCode(rawCode);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Load the code and validate it is still active
    const access = await tx.professorAccess.findUnique({
      where: { codeHash },
    });

    if (!access) {
      auditLog('PROFESSOR_CODE_REDEMPTION_FAILED', {
        ip: context.ip,
        userAgent: context.userAgent,
        reason: 'invalid',
      });
      throw new AppError(401, 'Invalid access code');
    }

    if (!access.isActive) {
      auditLog('PROFESSOR_CODE_REDEMPTION_FAILED', {
        ip: context.ip,
        userAgent: context.userAgent,
        reason: 'inactive',
      });
      throw new AppError(401, 'Access code is no longer active');
    }

    // 2. Validate expiration
    if (access.expiresAt && access.expiresAt < new Date()) {
      auditLog('PROFESSOR_CODE_REDEMPTION_FAILED', {
        ip: context.ip,
        userAgent: context.userAgent,
        reason: 'expired',
      });
      throw new AppError(401, 'Access code has expired');
    }

    // 3. Constant-time hash verification
    if (!constantTimeCompare(codeHash, access.codeHash)) {
      throw new AppError(401, 'Invalid access code');
    }

    // 4. Email collision check + find-or-create professor
    const existing = await tx.user.findUnique({ where: { email: normalizedEmail } });

    if (existing && existing.role !== 'PROFESSOR') {
      throw new AppError(409, 'Email already associated with a non-professor account');
    }

    const professor = existing ?? await tx.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: await argon2.hash(crypto.randomBytes(32).toString('hex')),
        role: 'PROFESSOR',
        studentIdentityId: null,
      },
    });

    // 5. Create/reactivate supervision link (idempotent)
    await tx.professorStudentLink.upsert({
      where: {
        professorId_studentId: {
          professorId: professor.id,
          studentId: access.studentId,
        },
      },
      update: { isActive: true },
      create: {
        professorId: professor.id,
        studentId: access.studentId,
        isActive: true,
      },
    });

    auditLog('PROFESSOR_LINK_CREATED', {
      userId: professor.id,
      targetId: access.studentId,
      ip: context.ip,
    });

    return { professor, studentId: access.studentId };
  });

  // Issue tokens outside transaction
  const payload = {
    sub: result.professor.id,
    role: 'PROFESSOR' as const,
  };

  const accessToken = jwt.sign(
    payload,
    config.jwtAccessSecret as Secret,
    { expiresIn: config.jwtAccessExpiresIn } as SignOptions,
  );

  const refreshToken = crypto.randomBytes(48).toString('hex');
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + parseExpiresIn(config.jwtRefreshExpiresIn));

  await prisma.session.create({
    data: {
      userId: result.professor.id,
      refreshTokenHash,
      userAgent: context.userAgent || null,
      ipAddress: context.ip || null,
      expiresAt,
    },
  });

  await prisma.user.update({
    where: { id: result.professor.id },
    data: { lastLoginAt: new Date() },
  });

  auditLog('PROFESSOR_LOGIN', {
    userId: result.professor.id,
    ip: context.ip,
    userAgent: context.userAgent,
  });

  return {
    accessToken,
    refreshToken,
    professorId: result.professor.id,
  };
}
