import express from 'express';
import request from 'supertest';
import authRoutes from '../../routes/auth.routes';
import { errorHandler } from '../../middleware/error-handler';
import * as authService from '../../services/auth.service';
import { AppError } from '../../middleware/error-handler';

jest.mock('../../middleware/rate-limiter', () => ({
  loginRateLimiter: (_req: any, _res: any, next: any) => next(),
  professorLoginRateLimiter: (_req: any, _res: any, next: any) => next(),
}));

describe('auth controller', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRoutes);
  app.use(errorHandler);

  it('POST /api/v1/auth/login returns tokens', async () => {
    jest.spyOn(authService, 'login').mockResolvedValue({
      tokens: { accessToken: 'a', refreshToken: 'b' },
      isNewAccount: false,
      user: { id: 'u1', role: 'STUDENT', studentNumber: '20201234', email: 'student@school.pt' },
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'student@school.pt', password: 'pass123' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ accessToken: 'a', refreshToken: 'b' });
  });

  it('POST /api/v1/auth/login returns validation error on bad payload', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: '', password: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation error');
  });

  it('POST /api/v1/auth/refresh propagates auth errors', async () => {
    jest.spyOn(authService, 'refreshTokens').mockRejectedValue(new Error('Invalid refresh token'));

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'bad-token' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });

  it('POST /api/v1/auth/refresh returns new tokens', async () => {
    jest.spyOn(authService, 'refreshTokens').mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'valid-token' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ accessToken: 'new-access', refreshToken: 'new-refresh' });
  });

  it('POST /api/v1/auth/logout returns success', async () => {
    jest.spyOn(authService, 'logout').mockResolvedValue(undefined);

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: 'valid-token' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');
  });

  it('POST /api/v1/auth/login maps service AppError responses', async () => {
    jest.spyOn(authService, 'login').mockRejectedValue(new AppError(401, 'Invalid credentials'));

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'student@school.pt', password: 'wrong-pass' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });
});
