import { calculateDashboardStats } from '../../services/time-engine.service';

jest.mock('../../services/settings.service', () => ({
  getSettings: jest.fn().mockResolvedValue({
    totalRequiredHours: 400,
    dailyWorkHours: 7,
    workingDays: [1, 2, 3, 4, 5],
    startDate: new Date('2026-01-01'),
  }),
}));

jest.mock('../../services/work-log.service', () => ({
  getTotalHoursLogged: jest.fn(),
  getWorkLogCount: jest.fn(),
}));

jest.mock('../../services/holiday.service', () => ({
  getHolidayDatesSet: jest.fn().mockResolvedValue(new Set<string>()),
}));

describe('time-engine.service', () => {
  const workLogService = jest.requireMock('../../services/work-log.service') as {
    getTotalHoursLogged: jest.Mock;
    getWorkLogCount: jest.Mock;
  };
  const settingsService = jest.requireMock('../../services/settings.service') as {
    getSettings: jest.Mock;
  };

  it('calculates percent complete and remaining hours', async () => {
    workLogService.getTotalHoursLogged.mockResolvedValue(200);
    workLogService.getWorkLogCount.mockResolvedValue(25);

    const stats = await calculateDashboardStats('student-1');

    expect(stats.percentComplete).toBe(50);
    expect(stats.remainingHours).toBe(200);
    expect(stats.avgHoursPerDay).toBe(8);
    expect(stats.predictedEndDate).toBeTruthy();
  });

  it('handles zero logs using configured daily hours', async () => {
    workLogService.getTotalHoursLogged.mockResolvedValue(0);
    workLogService.getWorkLogCount.mockResolvedValue(0);

    const stats = await calculateDashboardStats('student-1');

    expect(stats.percentComplete).toBe(0);
    expect(stats.avgHoursPerDay).toBe(7);
    expect(stats.daysWorked).toBe(0);
  });

  it('returns completed internship when required hours are fully met', async () => {
    workLogService.getTotalHoursLogged.mockResolvedValue(400);
    workLogService.getWorkLogCount.mockResolvedValue(50);

    const stats = await calculateDashboardStats('student-1');

    expect(stats.percentComplete).toBe(100);
    expect(stats.remainingHours).toBe(0);
    expect(stats.predictedEndDate).toBeNull();
    expect(stats.remainingWorkDays).toBe(0);
  });

  it('normalizes invalid settings values and uses safe defaults', async () => {
    settingsService.getSettings.mockResolvedValueOnce({
      totalRequiredHours: 100,
      dailyWorkHours: 0,
      workingDays: [9, 'x', 1, 1],
      startDate: new Date('2026-01-01'),
    });
    workLogService.getTotalHoursLogged.mockResolvedValue(50);
    workLogService.getWorkLogCount.mockResolvedValue(0);

    const stats = await calculateDashboardStats('student-1');

    expect(stats.avgHoursPerDay).toBe(7);
    expect(stats.remainingWorkDays).toBeGreaterThan(0);
  });
});
