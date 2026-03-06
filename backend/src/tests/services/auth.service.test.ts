import * as argon2 from 'argon2';

jest.mock('argon2', () => ({
  verify: jest.fn(),
  hash: jest.fn(),
}));
import jwt from 'jsonwebtoken';
import { AppError } from '../../middleware/error-handler';
import { prismaMock } from '../mocks/prisma.mock';
import { createMockStudent } from '../factories';
import { config } from '../../config';
import {
  findStudentIdentity,
  handlePasswordSetup,
  logout,
  issueTokens,
  login,
  refreshTokens,
  validateDomain,
} from '../../services/auth.service';
import { auditLog } from '../../utils/audit-logger';

jest.mock('../../utils/audit-logger', () => ({
  auditLog: jest.fn(),
}));

describe('auth.service', () => {
  const context = { ip: '127.0.0.1', userAgent: 'jest' };

  const originalAllowMultipleSessions = config.allowMultipleSessions;
  const originalAllowFirstLoginPasswordSetup = config.allowFirstLoginPasswordSetup;

  beforeEach(() => {
    config.allowMultipleSessions = false;
    config.allowFirstLoginPasswordSetup = true;
  });

  afterAll(() => {
    config.allowMultipleSessions = originalAllowMultipleSessions;
    config.allowFirstLoginPasswordSetup = originalAllowFirstLoginPasswordSetup;
  });

  it('finds student identity by email', async () => {
    prismaMock.studentIdentity.findUnique.mockResolvedValue({ id: 'identity-1' } as any);

    const result = await findStudentIdentity('student@school.pt');

    expect(result).toEqual({ id: 'identity-1' });
    expect(prismaMock.studentIdentity.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { institutionalEmail: 'student@school.pt' },
      }),
    );
  });

  it('finds student identity by student number', async () => {
    prismaMock.studentIdentity.findFirst.mockResolvedValue({ id: 'identity-1' } as any);

    const result = await findStudentIdentity('20201234');

    expect(result).toEqual({ id: 'identity-1' });
    expect(prismaMock.studentIdentity.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { studentNumber: '20201234', isActive: true },
      }),
    );
  });

  it('validateDomain rejects mismatched institutional domain', () => {
    expect(() => validateDomain('student@other.pt', 'school.pt')).toThrow(
      new AppError(403, 'Institutional validation failed'),
    );
  });

  it('validateDomain ignores non-email identifiers', () => {
    expect(() => validateDomain('20201234', 'school.pt')).not.toThrow();
  });

  it('creates user during first-login password setup', async () => {
    prismaMock.studentIdentity.findUnique.mockResolvedValue({
      id: 'identity-1',
      institutionalEmail: 'Student@School.pt',
      needsPasswordSetup: true,
    } as any);
    (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');

    const tx = {
      user: { create: jest.fn().mockResolvedValue({ id: 'student-1', role: 'STUDENT' }) },
      studentIdentity: { update: jest.fn().mockResolvedValue({}) },
    };
    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(tx));

    const user = await handlePasswordSetup('identity-1', 'pass123');

    expect(user.id).toBe('student-1');
    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'student@school.pt',
          studentIdentityId: 'identity-1',
        }),
      }),
    );
  });

  it('rejects first-login password setup when feature is disabled', async () => {
    config.allowFirstLoginPasswordSetup = false;
    await expect(handlePasswordSetup('identity-1', 'pass123')).rejects.toMatchObject<AppError>({
      statusCode: 403,
    });
  });

  it('throws when first-login identity is invalid or not pending setup', async () => {
    prismaMock.studentIdentity.findUnique.mockResolvedValue({
      id: 'identity-1',
      needsPasswordSetup: false,
    } as any);
    await expect(handlePasswordSetup('identity-1', 'pass123')).rejects.toMatchObject<AppError>({
      statusCode: 401,
      message: 'Invalid credentials',
    });
  });

  it('logs in a student successfully', async () => {
    const student = createMockStudent();
    const studentIdentity = {
      ...student.studentIdentity,
      user: {
        id: student.id,
        role: 'STUDENT',
        passwordHash: student.passwordHash,
      },
    };

    prismaMock.studentIdentity.findUnique.mockResolvedValue(studentIdentity as any);
    prismaMock.session.deleteMany.mockResolvedValue({ count: 1 } as any);
    prismaMock.session.create.mockResolvedValue({ id: 'session-1' } as any);
    prismaMock.user.update.mockResolvedValue(student as any);

    (argon2.verify as jest.Mock).mockResolvedValue(true);

    const result = await login('student@school.pt', 'password123', context);

    expect(result.isNewAccount).toBe(false);
    expect(result.user.id).toBe(student.id);
    expect(result.tokens.accessToken).toBeTruthy();
    expect(result.tokens.refreshToken).toHaveLength(96);
    expect(auditLog).toHaveBeenCalledWith(
      'LOGIN_SUCCESS',
      expect.objectContaining({ userId: student.id, isNewAccount: false }),
    );
  });

  it('creates account on first login when identity has no user', async () => {
    prismaMock.studentIdentity.findUnique.mockResolvedValue({
      id: 'identity-1',
      studentNumber: '20201234',
      institutionalEmail: 'student@school.pt',
      isActive: true,
      needsPasswordSetup: true,
      user: null,
      institution: { domain: 'school.pt', isActive: true },
    } as any);
    prismaMock.studentIdentity.update.mockResolvedValue({ needsPasswordSetup: false } as any);
    (argon2.hash as jest.Mock).mockResolvedValue('hash');
    (argon2.verify as jest.Mock).mockResolvedValue(true);

    const tx = {
      user: {
        create: jest.fn().mockResolvedValue({
          id: 'student-new',
          role: 'STUDENT',
          passwordHash: 'hash',
        }),
      },
      studentIdentity: {
        update: jest.fn().mockResolvedValue({ id: 'identity-1', needsPasswordSetup: false }),
      },
    };
    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(tx));
    prismaMock.session.deleteMany.mockResolvedValue({ count: 0 } as any);
    prismaMock.session.create.mockResolvedValue({ id: 'session-1' } as any);
    prismaMock.user.update.mockResolvedValue({ id: 'student-new' } as any);

    const result = await login('student@school.pt', 'password123', context);
    expect(result.isNewAccount).toBe(true);
    expect(result.user.id).toBe('student-new');
  });

  it('throws on invalid password', async () => {
    const student = createMockStudent();
    prismaMock.studentIdentity.findUnique.mockResolvedValue({
      ...student.studentIdentity,
      user: {
        id: student.id,
        role: 'STUDENT',
        passwordHash: student.passwordHash,
      },
    } as any);
    (argon2.verify as jest.Mock).mockResolvedValue(false);

    await expect(login('student@school.pt', 'wrong', context)).rejects.toMatchObject<AppError>({
      statusCode: 401,
      message: 'Invalid credentials',
    });
  });

  it('rejects login when identity or institution is inactive', async () => {
    prismaMock.studentIdentity.findUnique.mockResolvedValue({
      ...createMockStudent().studentIdentity,
      user: null,
      isActive: false,
      institution: { domain: 'school.pt', isActive: true },
    } as any);
    await expect(login('student@school.pt', 'pass', context)).rejects.toMatchObject<AppError>({
      statusCode: 401,
    });

    prismaMock.studentIdentity.findUnique.mockResolvedValue({
      ...createMockStudent().studentIdentity,
      user: null,
      isActive: true,
      institution: { domain: 'school.pt', isActive: false },
    } as any);
    await expect(login('student@school.pt', 'pass', context)).rejects.toMatchObject<AppError>({
      statusCode: 401,
    });
  });

  it('issues tokens and stores session', async () => {
    prismaMock.session.deleteMany.mockResolvedValue({ count: 0 } as any);
    prismaMock.session.create.mockResolvedValue({ id: 'session-1' } as any);
    prismaMock.user.update.mockResolvedValue({ id: 'student-1' } as any);

    const tokens = await issueTokens(
      'student-1',
      {
        sub: 'student-1',
        role: 'STUDENT',
        studentNumber: '20201234',
        email: 'student@school.pt',
      },
      context,
    );

    const decoded = jwt.decode(tokens.accessToken) as jwt.JwtPayload;
    expect(decoded.sub).toBe('student-1');
    expect(decoded.role).toBe('STUDENT');
    expect(prismaMock.session.deleteMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.session.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'student-1' } }),
    );
  });

  it('does not clear sessions when multiple sessions are enabled', async () => {
    config.allowMultipleSessions = true;
    prismaMock.session.create.mockResolvedValue({ id: 'session-1' } as any);
    prismaMock.user.update.mockResolvedValue({ id: 'student-1' } as any);

    await issueTokens(
      'student-1',
      {
        sub: 'student-1',
        role: 'STUDENT',
        studentNumber: '20201234',
        email: 'student@school.pt',
      },
      context,
    );

    expect(prismaMock.session.deleteMany).not.toHaveBeenCalled();
  });

  it('throws when refresh token is invalid or expired', async () => {
    prismaMock.session.findFirst.mockResolvedValue(null);
    await expect(refreshTokens('refresh-token-value', context)).rejects.toMatchObject<AppError>({
      statusCode: 401,
      message: 'Invalid refresh token',
    });

    prismaMock.session.findFirst.mockResolvedValue({
      id: 'session-1',
      expiresAt: new Date(Date.now() - 1),
      user: { id: 'student-1', role: 'STUDENT', studentIdentity: createMockStudent().studentIdentity },
    } as any);
    prismaMock.session.delete.mockResolvedValue({ id: 'session-1' } as any);
    await expect(refreshTokens('refresh-token-value', context)).rejects.toMatchObject<AppError>({
      statusCode: 401,
      message: 'Refresh token expired',
    });
    expect(prismaMock.session.delete).toHaveBeenCalledWith({ where: { id: 'session-1' } });
  });

  it('refreshes professor token using role-safe payload', async () => {
    prismaMock.session.findFirst.mockResolvedValue({
      id: 'session-1',
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: 'prof-1',
        role: 'PROFESSOR',
        studentIdentity: null,
      },
    } as any);
    prismaMock.session.deleteMany.mockResolvedValue({ count: 1 } as any);
    prismaMock.session.create.mockResolvedValue({ id: 'session-2' } as any);
    prismaMock.user.update.mockResolvedValue({ id: 'prof-1' } as any);

    const tokens = await refreshTokens('refresh-token', context);
    expect(tokens.accessToken).toBeTruthy();
  });

  it('rejects unknown role during refresh', async () => {
    prismaMock.session.findFirst.mockResolvedValue({
      id: 'session-1',
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: 'user-1',
        role: 'ADMIN',
        studentIdentity: null,
      },
    } as any);
    prismaMock.session.deleteMany.mockResolvedValue({ count: 1 } as any);

    await expect(refreshTokens('refresh-token', context)).rejects.toMatchObject<AppError>({
      statusCode: 401,
      message: 'Unknown role',
    });
  });

  it('removes refresh token session on logout', async () => {
    prismaMock.session.deleteMany.mockResolvedValue({ count: 1 } as any);
    await logout('refresh-token');
    expect(prismaMock.session.deleteMany).toHaveBeenCalledTimes(1);
  });
});
