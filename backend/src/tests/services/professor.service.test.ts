import * as argon2 from 'argon2';

jest.mock('argon2', () => ({
  verify: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('argon2', () => ({
  verify: jest.fn(),
  hash: jest.fn(),
}));
import crypto from 'crypto';
import { AppError } from '../../middleware/error-handler';
import { prismaMock } from '../mocks/prisma.mock';
import { createMockProfessor } from '../factories';
import {
  generateAccessCode,
  professorLogin,
} from '../../services/professor-access.service';

jest.mock('../../services/email.service', () => ({
  sendProfessorInvitationEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../utils/audit-logger', () => ({
  auditLog: jest.fn(),
}));

describe('professor-access.service', () => {
  const context = { ip: '127.0.0.1', userAgent: 'jest' };
  const rawCode = 'A'.repeat(16);
  const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');

  it('generates invitation code and deactivates previous ones', async () => {
    prismaMock.professorAccess.updateMany.mockResolvedValue({ count: 2 } as any);
    prismaMock.professorAccess.create.mockResolvedValue({ id: 'access-1' } as any);

    const result = await generateAccessCode('student-1', '  Prof@School.PT ');

    expect(result.message).toContain('Convite enviado');
    expect(prismaMock.professorAccess.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { studentId: 'student-1', isActive: true } }),
    );
    expect(prismaMock.professorAccess.create).toHaveBeenCalledTimes(1);
  });

  it('redeems a valid code and creates professor if missing', async () => {
    const tx = {
      professorAccess: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'access-1',
          studentId: 'student-1',
          codeHash,
          isActive: true,
          usedAt: null,
          expiresAt: new Date(Date.now() + 100_000),
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(createMockProfessor({ id: 'prof-1' })),
      },
      professorStudentLink: {
        upsert: jest.fn().mockResolvedValue({ id: 'link-1' }),
      },
    };

    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(tx));
    prismaMock.session.create.mockResolvedValue({ id: 'session-1' } as any);
    prismaMock.user.update.mockResolvedValue({ id: 'prof-1' } as any);
    (argon2.hash as jest.Mock).mockResolvedValue('hash');

    const result = await professorLogin('prof@school.pt', rawCode, context);

    expect(result.professorId).toBe('prof-1');
    expect(prismaMock.session.create).toHaveBeenCalledTimes(1);
    expect(tx.professorStudentLink.upsert).toHaveBeenCalledTimes(1);
  });

  it('rejects expired code', async () => {
    const tx = {
      professorAccess: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'access-1',
          studentId: 'student-1',
          codeHash,
          isActive: true,
          usedAt: null,
          expiresAt: new Date(Date.now() - 100_000),
        }),
      },
    };

    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(tx));

    await expect(professorLogin('prof@school.pt', rawCode, context)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Access code has expired',
    });
  });

  it('rejects reused code', async () => {
    const tx = {
      professorAccess: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'access-1',
          studentId: 'student-1',
          codeHash,
          isActive: true,
          usedAt: new Date(),
          expiresAt: new Date(Date.now() + 100_000),
        }),
      },
    };

    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(tx));

    await expect(professorLogin('prof@school.pt', rawCode, context)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Access code has already been used',
    });
  });

  it('reuses existing professor user', async () => {
    const existingProfessor = createMockProfessor({ id: 'prof-existing', email: 'prof@school.pt' });
    const tx = {
      professorAccess: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'access-1',
          studentId: 'student-1',
          codeHash,
          isActive: true,
          usedAt: null,
          expiresAt: new Date(Date.now() + 100_000),
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(existingProfessor),
        create: jest.fn(),
      },
      professorStudentLink: {
        upsert: jest.fn().mockResolvedValue({ id: 'link-1' }),
      },
    };

    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(tx));
    prismaMock.session.create.mockResolvedValue({ id: 'session-1' } as any);
    prismaMock.user.update.mockResolvedValue(existingProfessor as any);

    const result = await professorLogin('prof@school.pt', rawCode, context);

    expect(result.professorId).toBe('prof-existing');
    expect(tx.user.create).not.toHaveBeenCalled();
  });
});
