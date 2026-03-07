import jwt from 'jsonwebtoken';
import { authMiddleware } from '../../middleware/auth.middleware';
import { prismaMock } from '../mocks/prisma.mock';
import { AppError } from '../../middleware/error-handler';

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    verify: jest.fn(),
    JsonWebTokenError: class JsonWebTokenError extends Error {},
    TokenExpiredError: class TokenExpiredError extends Error {},
  },
  JsonWebTokenError: class JsonWebTokenError extends Error {},
  TokenExpiredError: class TokenExpiredError extends Error {},
}));

describe('auth.middleware', () => {
  const next = jest.fn();

  const createReq = (auth?: string) => ({
    headers: { authorization: auth },
  }) as any;

  beforeEach(() => {
    next.mockReset();
  });

  it('accepts valid token and active session', async () => {
    (jwt.verify as jest.Mock).mockReturnValue({
      sub: 'user-1',
      role: 'STUDENT',
      studentNumber: '20201234',
      email: 'student@school.pt',
    });
    prismaMock.session.findFirst.mockResolvedValue({ id: 'session-1' } as any);

    const req = createReq('Bearer token');
    await authMiddleware(req, {} as any, next);

    expect(req.userId).toBe('user-1');
    expect(req.sessionId).toBe('session-1');
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects missing token', async () => {
    const req = createReq();
    await authMiddleware(req, {} as any, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
  });

  it('rejects malformed bearer header', async () => {
    const req = createReq('Basic token');
    await authMiddleware(req, {} as any, next);

    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Authentication required');
  });

  it('maps invalid JWT to invalid token error', async () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new (jwt.JsonWebTokenError as any)('bad token');
    });

    const req = createReq('Bearer token');
    await authMiddleware(req, {} as any, next);

    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Invalid token');
  });

  it('maps expired JWT to token expired error', async () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new (jwt.TokenExpiredError as any)('expired', new Date());
    });

    const req = createReq('Bearer token');
    await authMiddleware(req, {} as any, next);

    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Token expired');
  });

  it('rejects expired session', async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user-1', role: 'STUDENT' });
    prismaMock.session.findFirst.mockResolvedValue(null);

    const req = createReq('Bearer token');
    await authMiddleware(req, {} as any, next);

    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Session expired');
  });

  it('forwards unknown errors to next', async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user-1', role: 'STUDENT' });
    const dbErr = new Error('db down');
    prismaMock.session.findFirst.mockRejectedValue(dbErr);

    const req = createReq('Bearer token');
    await authMiddleware(req, {} as any, next);

    expect(next).toHaveBeenCalledWith(dbErr);
  });
});
