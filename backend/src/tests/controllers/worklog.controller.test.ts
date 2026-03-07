import express from 'express';
import request from 'supertest';

jest.mock('../../middleware/auth.middleware', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.userId = 'student-1';
    req.userRole = 'STUDENT';
    next();
  },
}));

import workLogsRoutes from '../../routes/work-logs.routes';
import { errorHandler } from '../../middleware/error-handler';
import * as workLogService from '../../services/work-log.service';
import { AppError } from '../../middleware/error-handler';

describe('work-log controller', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/work-logs', workLogsRoutes);
  app.use(errorHandler);

  it('GET /api/v1/work-logs returns list', async () => {
    jest.spyOn(workLogService, 'getWorkLogs').mockResolvedValue({
      data: [], total: 0, page: 1, limit: 50, totalPages: 0,
    });

    const res = await request(app).get('/api/v1/work-logs');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ data: [], total: 0 });
  });

  it('GET /api/v1/work-logs/:id returns a work log', async () => {
    jest.spyOn(workLogService, 'getWorkLogById').mockResolvedValue({
      id: 'log-1',
      calculatedHours: 7,
    } as any);

    const res = await request(app).get('/api/v1/work-logs/log-1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('log-1');
  });

  it('POST /api/v1/work-logs creates log', async () => {
    jest.spyOn(workLogService, 'createWorkLog').mockResolvedValue({
      id: 'log-1', date: '2026-03-02', type: 'NORMAL',
    } as any);

    const res = await request(app)
      .post('/api/v1/work-logs')
      .send({
        date: '2026-03-02',
        type: 'NORMAL',
        startTime: '09:00',
        endTime: '17:00',
        taskDescription: 'Implemented tests',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('log-1');
  });

  it('POST /api/v1/work-logs returns validation error for bad payload', async () => {
    const res = await request(app)
      .post('/api/v1/work-logs')
      .send({ date: '', type: 'INVALID' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation error');
  });

  it('POST /api/v1/work-logs maps duplicate-date prisma error', async () => {
    jest.spyOn(workLogService, 'createWorkLog').mockRejectedValue({ code: 'P2002' });

    const res = await request(app)
      .post('/api/v1/work-logs')
      .send({
        date: '2026-03-02',
        type: 'NORMAL',
        startTime: '09:00',
        endTime: '17:00',
        taskDescription: 'Implemented tests',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('A work log already exists for this date');
  });

  it('GET /api/v1/work-logs/:id returns 404 when log is missing', async () => {
    jest.spyOn(workLogService, 'getWorkLogById').mockResolvedValue(null);

    const res = await request(app).get('/api/v1/work-logs/log-404');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Work log not found');
  });

  it('PUT /api/v1/work-logs/:id maps P2025 to 404', async () => {
    jest.spyOn(workLogService, 'updateWorkLog').mockRejectedValue({ code: 'P2025' });

    const res = await request(app)
      .put('/api/v1/work-logs/log-1')
      .send({ taskDescription: 'Updated task' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Work log not found');
  });

  it('PUT /api/v1/work-logs/:id returns updated log on success', async () => {
    jest.spyOn(workLogService, 'updateWorkLog').mockResolvedValue({
      id: 'log-1',
      taskDescription: 'Updated task',
    } as any);

    const res = await request(app)
      .put('/api/v1/work-logs/log-1')
      .send({ taskDescription: 'Updated task' });

    expect(res.status).toBe(200);
    expect(res.body.taskDescription).toBe('Updated task');
  });

  it('DELETE /api/v1/work-logs/:id propagates AppError', async () => {
    jest.spyOn(workLogService, 'deleteWorkLog').mockRejectedValue(new AppError(403, 'Forbidden'));

    const res = await request(app).delete('/api/v1/work-logs/log-1');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('DELETE /api/v1/work-logs/:id returns 204 on success', async () => {
    jest.spyOn(workLogService, 'deleteWorkLog').mockResolvedValue({ id: 'log-1' } as any);

    const res = await request(app).delete('/api/v1/work-logs/log-1');

    expect(res.status).toBe(204);
  });

  it('GET /api/v1/work-logs/export-csv returns CSV with headers', async () => {
    jest.spyOn(workLogService, 'exportWorkLogsCsv').mockResolvedValue('date,type\n2026-03-01,NORMAL');

    const res = await request(app).get('/api/v1/work-logs/export-csv');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('date,type');
  });

  it('POST /api/v1/work-logs/import-csv imports raw CSV body', async () => {
    jest.spyOn(workLogService, 'importWorkLogsCsv').mockResolvedValue({
      created: 1,
      updated: 0,
      skipped: 0,
      total: 1,
      errors: [],
    });

    const res = await request(app)
      .post('/api/v1/work-logs/import-csv')
      .set('Content-Type', 'text/csv')
      .send('date,type\n2026-03-01,NORMAL');

    expect(res.status).toBe(200);
    expect(res.body.created).toBe(1);
  });

  it('POST /api/v1/work-logs/import-csv validates empty content', async () => {
    const res = await request(app)
      .post('/api/v1/work-logs/import-csv')
      .set('Content-Type', 'text/csv')
      .send('   ');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('CSV content is required');
  });
});
