import { AppError } from '../../middleware/error-handler';
import { prismaMock } from '../mocks/prisma.mock';
import { createMockWorkLog } from '../factories';
import {
  computeHours,
  createWorkLog,
  exportWorkLogsCsv,
  deleteWorkLog,
  getAllWorkLogs,
  getTotalHoursLogged,
  getWorkLogById,
  getWorkLogCount,
  getWorkLogs,
  importWorkLogsCsv,
  updateWorkLog,
} from '../../services/work-log.service';
import { getSettings } from '../../services/settings.service';

jest.mock('../../services/settings.service', () => ({
  getSettings: jest.fn().mockResolvedValue({
    organizationName: 'StageSync',
  }),
}));

describe('work-log.service', () => {
  it('calculates hours with lunch break', () => {
    expect(computeHours('NORMAL', '09:00', '17:00', '12:00', '13:00')).toBe(7);
  });

  it('returns 0 hours for non-normal logs and prevents negative values', () => {
    expect(computeHours('HOLIDAY', '09:00', '17:00')).toBe(0);
    expect(computeHours('NORMAL', '12:00', '11:00')).toBe(0);
  });

  it('lists work logs with filters and pagination', async () => {
    prismaMock.workLog.findMany.mockResolvedValue([createMockWorkLog()] as any);
    prismaMock.workLog.count.mockResolvedValue(1);

    const result = await getWorkLogs(
      { from: '2026-03-01', to: '2026-03-31', page: 2, limit: 10 },
      'student-1',
    );

    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(prismaMock.workLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'student-1',
          date: expect.objectContaining({
            gte: new Date('2026-03-01'),
            lte: new Date('2026-03-31'),
          }),
        }),
        skip: 10,
        take: 10,
      }),
    );
  });

  it('gets work log by id and lists all logs', async () => {
    prismaMock.workLog.findFirst.mockResolvedValue(createMockWorkLog({ id: 'log-1' }) as any);
    prismaMock.workLog.findMany.mockResolvedValue([createMockWorkLog({ id: 'log-1' })] as any);

    const log = await getWorkLogById('log-1', 'student-1');
    const all = await getAllWorkLogs('student-1');

    expect(log?.id).toBe('log-1');
    expect(all).toHaveLength(1);
  });

  it('creates work log with computed hours', async () => {
    const created = createMockWorkLog();
    prismaMock.workLog.create.mockResolvedValue(created as any);

    const result = await createWorkLog({
      date: '2026-03-02',
      type: 'NORMAL',
      startTime: '09:00',
      endTime: '17:00',
      lunchStart: '12:00',
      lunchEnd: '13:00',
      taskDescription: 'Testing',
    }, 'student-1');

    expect(result.id).toBe(created.id);
    expect(prismaMock.workLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          calculatedHours: 7,
          company: 'StageSync',
          userId: 'student-1',
        }),
      }),
    );
  });

  it('rejects creation when organization is not configured', async () => {
    (getSettings as jest.Mock).mockResolvedValueOnce({ organizationName: '   ' });
    await expect(
      createWorkLog(
        {
          date: '2026-03-02',
          type: 'NORMAL',
          startTime: '09:00',
          endTime: '17:00',
        },
        'student-1',
      ),
    ).rejects.toMatchObject<AppError>({ statusCode: 400 });
  });

  it('updates a work log and supports absence type', async () => {
    prismaMock.workLog.findFirst.mockResolvedValue(createMockWorkLog() as any);
    prismaMock.workLog.update.mockResolvedValue(
      createMockWorkLog({ type: 'JUSTIFIED_ABSENCE', justification: 'Medical' }) as any,
    );

    const result = await updateWorkLog(
      'log-1',
      { type: 'JUSTIFIED_ABSENCE', justification: 'Medical', startTime: undefined },
      'student-1',
    );

    expect(result.type).toBe('JUSTIFIED_ABSENCE');
    expect(prismaMock.workLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'log-1' },
        data: expect.objectContaining({
          startTime: null,
          endTime: null,
          lunchStart: null,
          lunchEnd: null,
          justification: 'Medical',
          calculatedHours: 0,
        }),
      }),
    );
  });

  it('updates a work log', async () => {
    prismaMock.workLog.findFirst.mockResolvedValue(createMockWorkLog() as any);
    prismaMock.workLog.update.mockResolvedValue(createMockWorkLog({ taskDescription: 'Updated' }) as any);

    const result = await updateWorkLog('log-1', { taskDescription: 'Updated' }, 'student-1');

    expect(result.taskDescription).toBe('Updated');
    expect(prismaMock.workLog.update).toHaveBeenCalledTimes(1);
  });

  it('throws when updating non-existing log', async () => {
    prismaMock.workLog.findFirst.mockResolvedValue(null);
    await expect(updateWorkLog('missing', { taskDescription: 'x' }, 'student-1')).rejects.toMatchObject<AppError>({
      statusCode: 404,
      message: 'Work log not found',
    });
  });

  it('throws when deleting non-existing log', async () => {
    prismaMock.workLog.findFirst.mockResolvedValue(null);

    await expect(deleteWorkLog('missing', 'student-1')).rejects.toMatchObject<AppError>({
      statusCode: 404,
      message: 'Work log not found',
    });
  });

  it('deletes existing work log', async () => {
    prismaMock.workLog.findFirst.mockResolvedValue(createMockWorkLog({ id: 'log-1' }) as any);
    prismaMock.workLog.delete.mockResolvedValue(createMockWorkLog({ id: 'log-1' }) as any);

    const result = await deleteWorkLog('log-1', 'student-1');
    expect(result.id).toBe('log-1');
  });

  it('gets totals with aggregate fallback', async () => {
    prismaMock.workLog.aggregate.mockResolvedValue({ _sum: { calculatedHours: null } } as any);
    prismaMock.workLog.count.mockResolvedValue(3);
    expect(await getTotalHoursLogged('student-1')).toBe(0);
    expect(await getWorkLogCount('student-1')).toBe(3);
  });

  it('imports CSV and updates existing date', async () => {
    prismaMock.workLog.findUnique.mockResolvedValue({ id: 'log-existing' } as any);
    prismaMock.workLog.update.mockResolvedValue(createMockWorkLog({ id: 'log-existing' }) as any);

    const csv = [
      'date,type,startTime,endTime,lunchStart,lunchEnd,company,taskDescription,justification',
      '2026-03-02,NORMAL,09:00,17:00,12:00,13:00,StageSync,CSV task,',
    ].join('\n');

    const result = await importWorkLogsCsv(csv, 'student-1');

    expect(result.updated).toBe(1);
    expect(result.created).toBe(0);
    expect(prismaMock.workLog.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'log-existing' } }),
    );
  });

  it('imports CSV and creates new rows with header aliases and BOM', async () => {
    prismaMock.workLog.findUnique.mockResolvedValue(null);
    prismaMock.workLog.create.mockResolvedValue(createMockWorkLog({ id: 'log-new' }) as any);

    const csv = [
      '\uFEFFdata,tipo,hora início,hora fim,início almoço,fim almoço,empresa,descrição,justificação',
      '2026-03-03,normal,09:00,17:00,12:00,13:00,StageSync,Task from csv,',
    ].join('\n');

    const result = await importWorkLogsCsv(csv, 'student-1');

    expect(result.created).toBe(1);
    expect(result.updated).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('skips invalid rows and reports CSV validation errors', async () => {
    prismaMock.workLog.findUnique.mockResolvedValue(null);

    const csv = [
      'date,type,startTime,endTime,lunchStart,lunchEnd,company,taskDescription,justification',
      ',NORMAL,09:00,17:00,12:00,13:00,StageSync,Missing date,',
      'invalid-date,NORMAL,09:00,17:00,12:00,13:00,StageSync,Bad date,',
      '2026-03-05,UNKNOWN,09:00,17:00,12:00,13:00,StageSync,Bad type,',
      '2026-03-05,NORMAL,09:00,17:00,12:00,13:00,,No company,',
    ].join('\n');

    (getSettings as jest.Mock).mockResolvedValueOnce({ organizationName: '' });
    const result = await importWorkLogsCsv(csv, 'student-1');

    expect(result.skipped).toBe(4);
    expect(result.created).toBe(0);
    expect(result.errors.map((e) => e.row)).toEqual([2, 3, 4, 5]);
  });

  it('throws when CSV is empty', async () => {
    await expect(importWorkLogsCsv('', 'student-1')).rejects.toMatchObject<AppError>({
      statusCode: 400,
      message: 'CSV file is empty or has no data rows',
    });
  });

  it('exports CSV with escaped fields', async () => {
    prismaMock.workLog.findMany.mockResolvedValue([
      createMockWorkLog({
        id: 'log-1',
        taskDescription: 'Task with "quotes", commas, and\nnew lines',
      }),
    ] as any);

    const csv = await exportWorkLogsCsv('student-1');
    expect(csv).toContain('date,type,startTime,endTime,lunchStart,lunchEnd,calculatedHours,company,taskDescription,justification');
    expect(csv).toContain('""quotes""');
  });
});
