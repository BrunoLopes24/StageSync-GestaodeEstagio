import express from 'express';
import request from 'supertest';

jest.mock('../../middleware/auth.middleware', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.userId = 'prof-1';
    req.userRole = 'PROFESSOR';
    next();
  },
}));

jest.mock('../../middleware/require-professor', () => ({
  requireProfessor: (req: any, _res: any, next: any) => {
    req.supervisedStudentIds = ['student-1'];
    next();
  },
  assertProfessorOwnsStudent: jest.fn(),
}));

jest.mock('../../middleware/require-student', () => ({
  requireStudent: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../middleware/rate-limiter', () => ({
  loginRateLimiter: (_req: any, _res: any, next: any) => next(),
  professorLoginRateLimiter: (_req: any, _res: any, next: any) => next(),
}));

import professorRoutes from '../../routes/professor.routes';
import { errorHandler } from '../../middleware/error-handler';
import * as professorService from '../../services/professor.service';
import * as professorAccessService from '../../services/professor-access.service';
import { assertProfessorOwnsStudent } from '../../middleware/require-professor';
import { AppError } from '../../middleware/error-handler';

describe('professor controller', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/professor', professorRoutes);
  app.use(errorHandler);

  it('POST /api/v1/professor/login returns professor tokens', async () => {
    jest.spyOn(professorAccessService, 'professorLogin').mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      professorId: 'prof-1',
    });

    const res = await request(app)
      .post('/api/v1/professor/login')
      .send({ email: 'prof@school.pt', code: 'ABCD-ABCD-ABCD-ABCD' });

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: 'prof-1', role: 'PROFESSOR' });
  });

  it('GET /api/v1/professor/dashboard returns aggregated dashboard', async () => {
    jest.spyOn(professorService, 'getAggregatedDashboard').mockResolvedValue({
      totalStudents: 1,
      students: [{ studentId: 'student-1' }],
    } as any);

    const res = await request(app).get('/api/v1/professor/dashboard');

    expect(res.status).toBe(200);
    expect(res.body.totalStudents).toBe(1);
  });

  it('POST /api/v1/professor/login validates payload', async () => {
    const res = await request(app)
      .post('/api/v1/professor/login')
      .send({ email: 'invalid-email', code: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation error');
  });

  it('GET /api/v1/professor/dashboard returns service errors', async () => {
    jest.spyOn(professorService, 'getAggregatedDashboard').mockRejectedValue(new AppError(403, 'No access'));

    const res = await request(app).get('/api/v1/professor/dashboard');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('No access');
  });

  it('GET /api/v1/professor/students returns supervised student list', async () => {
    jest.spyOn(professorService, 'getSupervisedStudents').mockResolvedValue([
      { studentId: 'student-1', studentNumber: '20201234', email: 'student@school.pt' },
    ] as any);

    const res = await request(app).get('/api/v1/professor/students');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('GET /api/v1/professor/dashboard/:studentId returns student dashboard', async () => {
    (assertProfessorOwnsStudent as jest.Mock).mockImplementation(() => undefined);
    jest.spyOn(professorService, 'getStudentDashboard').mockResolvedValue({
      student: { studentNumber: '20201234', email: 'student@school.pt', name: 'Ana' },
      stats: { percentComplete: 30 },
    } as any);

    const res = await request(app).get('/api/v1/professor/dashboard/student-1');

    expect(res.status).toBe(200);
    expect(res.body.student.studentNumber).toBe('20201234');
  });

  it('GET /api/v1/professor/work-logs/:studentId returns student logs', async () => {
    (assertProfessorOwnsStudent as jest.Mock).mockImplementation(() => undefined);
    jest.spyOn(professorService, 'getStudentWorkLogs').mockResolvedValue({
      logs: [{ id: 'log-1' }],
      total: 1,
      page: 1,
      limit: 50,
    } as any);

    const res = await request(app).get('/api/v1/professor/work-logs/student-1?page=1&limit=50');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
  });

  it('student access-code endpoints call service methods', async () => {
    jest.spyOn(professorService, 'getActiveCodeStatus').mockResolvedValue({ hasActiveCode: false } as any);
    jest.spyOn(professorService, 'generateAccessCode').mockResolvedValue({ message: 'Convite enviado' } as any);
    jest.spyOn(professorService, 'getLinkedProfessor').mockResolvedValue({ professorEmail: 'prof@school.pt' } as any);
    jest.spyOn(professorService, 'revokeLink').mockResolvedValue(undefined);

    const status = await request(app).get('/api/v1/professor/access-code');
    const create = await request(app).post('/api/v1/professor/access-code').send({ professorEmail: 'prof@school.pt' });
    const link = await request(app).get('/api/v1/professor/link');
    const revoke = await request(app).delete('/api/v1/professor/link');
    const revokeCode = await request(app).delete('/api/v1/professor/access-code');

    expect(status.status).toBe(200);
    expect(create.status).toBe(201);
    expect(link.status).toBe(200);
    expect(revoke.status).toBe(204);
    expect(revokeCode.status).toBe(403);
  });

  it('GET /api/v1/professor/work-logs/:studentId enforces ownership', async () => {
    (assertProfessorOwnsStudent as jest.Mock).mockImplementationOnce(() => {
      throw new AppError(403, 'You do not have access to this student');
    });

    const res = await request(app).get('/api/v1/professor/work-logs/student-2');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('You do not have access to this student');
  });
});
