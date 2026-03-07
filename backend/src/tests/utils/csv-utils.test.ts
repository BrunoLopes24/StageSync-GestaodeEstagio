import { AppError } from '../../middleware/error-handler';
import { prismaMock } from '../mocks/prisma.mock';
import { createMockWorkLog } from '../factories';
import { exportWorkLogsCsv, importWorkLogsCsv } from '../../services/work-log.service';

jest.mock('../../services/settings.service', () => ({
  getSettings: jest.fn().mockResolvedValue({ organizationName: 'StageSync' }),
}));

describe('work-log CSV utilities', () => {
  it('exports CSV with header + rows', async () => {
    prismaMock.workLog.findMany.mockResolvedValue([createMockWorkLog()] as any);

    const csv = await exportWorkLogsCsv('student-1');

    expect(csv).toContain('date,type,startTime,endTime');
    expect(csv).toContain('Implemented API endpoints');
  });

  it('rejects empty CSV import', async () => {
    await expect(importWorkLogsCsv('', 'student-1')).rejects.toMatchObject({
      statusCode: 400,
      message: 'CSV file is empty or has no data rows',
    });
  });

  it('reports invalid rows and missing columns', async () => {
    const csv = [
      'date,type,company',
      ',NORMAL,StageSync',
      'not-a-date,NORMAL,StageSync',
    ].join('\n');

    const result = await importWorkLogsCsv(csv, 'student-1');

    expect(result.skipped).toBe(2);
    expect(result.errors[0].error).toContain('Missing required field: date');
    expect(result.errors[1].error).toContain('Invalid date format');
  });
});
