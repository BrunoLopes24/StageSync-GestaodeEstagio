import * as argon2 from 'argon2';
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { AppError } from '../middleware/error-handler';
import { auditLog } from '../utils/audit-logger';

// ─── Constants ────────────────────────────────────────────

const INVALID_CREDENTIALS_MSG = 'Invalid credentials';

// ─── Helpers ──────────────────────────────────────────────

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid expiresIn format: ${expiresIn}`);
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * multipliers[unit];
}

// ─── Types ────────────────────────────────────────────────

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface JwtPayload {
  sub: string;
  role: string;
  studentNumber: string;
  email: string;
}

interface LoginContext {
  ip: string;
  userAgent: string;
}

// ─── 1. findStudentIdentity ───────────────────────────────

export async function findStudentIdentity(identifier: string) {
  const isEmail = identifier.includes('@');

  if (isEmail) {
    return prisma.studentIdentity.findUnique({
      where: { institutionalEmail: identifier },
      include: { institution: true, user: true },
    });
  }

  return prisma.studentIdentity.findFirst({
    where: { studentNumber: identifier, isActive: true },
    include: { institution: true, user: true },
  });
}

// ─── 2. validateDomain ────────────────────────────────────

export function validateDomain(identifier: string, institutionDomain: string): void {
  if (!identifier.includes('@')) return;

  const emailDomain = identifier.split('@')[1].toLowerCase();
  if (emailDomain !== institutionDomain.toLowerCase()) {
    throw new AppError(403, 'Institutional validation failed');
  }
}

// ─── 3. handlePasswordSetup ──────────────────────────────

export async function handlePasswordSetup(studentIdentityId: string, password: string) {
  if (!config.allowFirstLoginPasswordSetup) {
    throw new AppError(403, 'First-login password setup is disabled');
  }

  const identity = await prisma.studentIdentity.findUnique({
    where: { id: studentIdentityId },
  });

  if (!identity || !identity.needsPasswordSetup) {
    throw new AppError(401, INVALID_CREDENTIALS_MSG);
  }

  const passwordHash = await argon2.hash(password);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        passwordHash,
        role: 'STUDENT',
        studentIdentityId,
      },
    });

    await tx.studentIdentity.update({
      where: { id: studentIdentityId },
      data: { needsPasswordSetup: false },
    });

    return newUser;
  });

  return user;
}

// ─── 4. validatePassword ─────────────────────────────────

export async function validatePassword(passwordHash: string, candidatePassword: string): Promise<boolean> {
  return argon2.verify(passwordHash, candidatePassword);
}

// ─── 5. issueTokens ─────────────────────────────────────

export async function issueTokens(
  userId: string,
  role: string,
  studentNumber: string,
  email: string,
  context: LoginContext,
): Promise<TokenPair> {
  if (!config.allowMultipleSessions) {
    await prisma.session.deleteMany({ where: { userId } });
  }

  const payload: JwtPayload = {
    sub: userId,
    role,
    studentNumber,
    email,
  };

  const accessToken = jwt.sign(
    payload,
    config.jwtAccessSecret as Secret,
    {
      expiresIn: config.jwtAccessExpiresIn,
    } as SignOptions,
  );

  const refreshToken = crypto.randomBytes(48).toString('hex');
  const refreshTokenHash = hashToken(refreshToken);

  const expiresAt = new Date(Date.now() + parseExpiresIn(config.jwtRefreshExpiresIn));

  await prisma.session.create({
    data: {
      userId,
      refreshTokenHash,
      userAgent: context.userAgent || null,
      ipAddress: context.ip || null,
      expiresAt,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });

  return { accessToken, refreshToken };
}

// ─── 6. refreshTokens ───────────────────────────────────

export async function refreshTokens(refreshToken: string, context: LoginContext): Promise<TokenPair> {
  const tokenHash = hashToken(refreshToken);

  const session = await prisma.session.findFirst({
    where: { refreshTokenHash: tokenHash },
    include: {
      user: {
        include: {
          studentIdentity: true,
        },
      },
    },
  });

  if (!session) {
    throw new AppError(401, 'Invalid refresh token');
  }

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    throw new AppError(401, 'Refresh token expired');
  }

  // Delete old session (token rotation)
  await prisma.session.delete({ where: { id: session.id } });

  const { user } = session;
  return issueTokens(
    user.id,
    user.role,
    user.studentIdentity.studentNumber,
    user.studentIdentity.institutionalEmail,
    context,
  );
}

// ─── 7. logout ───────────────────────────────────────────

export async function logout(refreshToken: string): Promise<void> {
  const tokenHash = hashToken(refreshToken);
  await prisma.session.deleteMany({
    where: { refreshTokenHash: tokenHash },
  });
}

// ─── 8. login (orchestrator) ─────────────────────────────

export async function login(
  identifier: string,
  password: string,
  context: LoginContext,
): Promise<{ tokens: TokenPair; isNewAccount: boolean; user: { id: string; role: string; studentNumber: string; email: string } }> {
  // Step 1: Find student identity
  const studentIdentity = await findStudentIdentity(identifier);
  if (!studentIdentity) {
    auditLog('LOGIN_FAILED', { identifier, ip: context.ip, reason: 'identity_not_found' });
    throw new AppError(401, INVALID_CREDENTIALS_MSG);
  }

  // Step 2: Check identity is active
  if (!studentIdentity.isActive) {
    auditLog('LOGIN_FAILED', { identifier, ip: context.ip, reason: 'identity_inactive' });
    throw new AppError(401, INVALID_CREDENTIALS_MSG);
  }

  // Step 3: Check institution is active
  if (!studentIdentity.institution.isActive) {
    auditLog('LOGIN_FAILED', { identifier, ip: context.ip, reason: 'institution_inactive' });
    throw new AppError(401, INVALID_CREDENTIALS_MSG);
  }

  // Step 4: Domain enforcement
  validateDomain(identifier, studentIdentity.institution.domain);

  // Step 5: Check if user exists or needs password setup
  let user = studentIdentity.user;
  let isNewAccount = false;

  if (!user) {
    if (!studentIdentity.needsPasswordSetup || !config.allowFirstLoginPasswordSetup) {
      auditLog('LOGIN_FAILED', { identifier, ip: context.ip, reason: 'no_user_setup_disabled' });
      throw new AppError(401, INVALID_CREDENTIALS_MSG);
    }

    user = await handlePasswordSetup(studentIdentity.id, password);
    isNewAccount = true;
  } else {
    const isValid = await validatePassword(user.passwordHash, password);
    if (!isValid) {
      auditLog('LOGIN_FAILED', {
        userId: user.id,
        identifier,
        ip: context.ip,
        reason: 'wrong_password',
      });
      throw new AppError(401, INVALID_CREDENTIALS_MSG);
    }
  }

  // Step 6: Issue tokens
  const tokens = await issueTokens(
    user.id,
    user.role,
    studentIdentity.studentNumber,
    studentIdentity.institutionalEmail,
    context,
  );

  auditLog('LOGIN_SUCCESS', {
    userId: user.id,
    identifier,
    ip: context.ip,
    isNewAccount,
  });

  return {
    tokens,
    isNewAccount,
    user: {
      id: user.id,
      role: user.role,
      studentNumber: studentIdentity.studentNumber,
      email: studentIdentity.institutionalEmail,
    },
  };
}
