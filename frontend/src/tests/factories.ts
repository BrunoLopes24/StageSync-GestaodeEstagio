import type { AggregatedDashboardStudent } from '@/types/professor';

export function createMockStudent(overrides: Partial<AggregatedDashboardStudent> = {}): AggregatedDashboardStudent {
  return {
    studentId: 'student-1',
    studentNumber: '20201234',
    email: 'student@school.pt',
    name: 'Ana Silva',
    totalHoursLogged: 120,
    totalRequiredHours: 400,
    percentComplete: 30,
    remainingHours: 280,
    remainingWorkDays: 40,
    predictedEndDate: '2026-07-30',
    avgHoursPerDay: 6,
    daysWorked: 20,
    startDate: '2026-01-15',
    recentLogs: [
      {
        id: 'log-1',
        date: '2026-03-01',
        taskDescription: 'Implemented dashboard tests',
        calculatedHours: 7,
      },
    ],
    lastActivityDate: '2026-03-01',
    weeklyLogCount: 3,
    internshipStatus: 'ON_TRACK',
    averageWeeklyHours: 21,
    ...overrides,
  };
}
