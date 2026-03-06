import { prismaMock } from '../mocks/prisma.mock';
import {
  getAggregatedDashboard,
  getStudentDashboard,
  getStudentWorkLogs,
  getSupervisedStudents,
} from '../../services/professor.service';
import { calculateDashboardStats } from '../../services/time-engine.service';

jest.mock('../../services/time-engine.service', () => ({
  calculateDashboardStats: jest.fn(),
}));

describe('professor.service (core)', () => {
  it('lists supervised students', async () => {
    prismaMock.professorStudentLink.findMany.mockResolvedValue([
      {
        studentId: 'student-1',
        createdAt: new Date('2026-03-01T10:00:00.000Z'),
        student: {
          email: 'student@school.pt',
          studentIdentity: { studentNumber: '20201234', institutionalEmail: 'student@school.pt' },
        },
      },
    ] as any);

    const result = await getSupervisedStudents('prof-1');

    expect(result).toEqual([
      {
        studentId: 'student-1',
        studentNumber: '20201234',
        email: 'student@school.pt',
        linkedAt: new Date('2026-03-01T10:00:00.000Z'),
      },
    ]);
  });

  it('returns student dashboard with student identity fallbacks', async () => {
    (calculateDashboardStats as jest.Mock).mockResolvedValue({
      totalHoursLogged: 80,
      totalRequiredHours: 400,
      percentComplete: 20,
      remainingHours: 320,
      remainingWorkDays: 46,
      predictedEndDate: '2026-09-01',
      avgHoursPerDay: 6.1,
      daysWorked: 13,
      startDate: '2026-01-01',
    });

    prismaMock.user.findUnique.mockResolvedValue({
      email: 'student@school.pt',
      studentIdentity: { studentNumber: '20201234' },
    } as any);
    prismaMock.settings.findUnique.mockResolvedValue({
      id: 'default',
      studentNumber: '20201234',
      studentName: 'Ana Silva',
    } as any);

    const result = await getStudentDashboard('student-1');

    expect(result.student).toEqual({
      studentNumber: '20201234',
      email: 'student@school.pt',
      name: 'Ana Silva',
    });
    expect(result.stats.percentComplete).toBe(20);
  });

  it('returns student work logs with defaults and pagination', async () => {
    prismaMock.workLog.findMany.mockResolvedValue([{ id: 'log-1' }] as any);
    prismaMock.workLog.count.mockResolvedValue(1);

    const result = await getStudentWorkLogs('student-1', {});

    expect(result).toEqual({ logs: [{ id: 'log-1' }], total: 1, page: 1, limit: 50 });
    expect(prismaMock.workLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 50 }),
    );
  });

  it('returns empty aggregated dashboard when professor has no links', async () => {
    prismaMock.settings.findUnique.mockResolvedValue({ id: 'default' } as any);
    prismaMock.professorStudentLink.findMany.mockResolvedValue([] as any);

    const result = await getAggregatedDashboard('prof-1');

    expect(result).toEqual({ totalStudents: 0, students: [] });
  });

  it('computes aggregated dashboard with completed student', async () => {
    prismaMock.settings.findUnique.mockResolvedValue({
      id: 'default',
      studentNumber: '20201234',
      studentName: 'Ana Silva',
      studentEmail: 'shared@school.pt',
    } as any);
    prismaMock.professorStudentLink.findMany.mockResolvedValue([{ studentId: 'student-1' }] as any);

    (calculateDashboardStats as jest.Mock).mockResolvedValue({
      totalHoursLogged: 410,
      totalRequiredHours: 400,
      percentComplete: 100,
      remainingHours: 0,
      remainingWorkDays: 0,
      predictedEndDate: '2026-06-01',
      avgHoursPerDay: 7,
      daysWorked: 58,
      startDate: '2026-01-01',
    });

    prismaMock.user.findUnique.mockResolvedValue({
      email: 'private@school.pt',
      studentIdentity: { studentNumber: '20201234' },
    } as any);
    prismaMock.workLog.findMany.mockResolvedValue([
      {
        id: 'log-1',
        date: new Date('2026-03-02T00:00:00.000Z'),
        taskDescription: 'Task 1',
        calculatedHours: 7,
      },
    ] as any);
    prismaMock.workLog.count.mockResolvedValue(3);

    const result = await getAggregatedDashboard('prof-1');

    expect(result.totalStudents).toBe(1);
    expect(result.students[0]).toMatchObject({
      studentId: 'student-1',
      studentNumber: '20201234',
      email: 'shared@school.pt',
      name: 'Ana Silva',
      internshipStatus: 'COMPLETED',
      weeklyLogCount: 3,
      lastActivityDate: '2026-03-02T00:00:00.000Z',
    });
    expect(result.students[0].recentLogs).toHaveLength(1);
  });

  it('computes internship status as NO_DATA when prediction is missing', async () => {
    prismaMock.settings.findUnique.mockResolvedValue({ id: 'default' } as any);
    prismaMock.professorStudentLink.findMany.mockResolvedValue([{ studentId: 'student-1' }] as any);
    (calculateDashboardStats as jest.Mock).mockResolvedValue({
      totalHoursLogged: 20,
      totalRequiredHours: 400,
      percentComplete: 5,
      remainingHours: 380,
      remainingWorkDays: 54,
      predictedEndDate: null,
      avgHoursPerDay: 2,
      daysWorked: 10,
      startDate: '2026-01-01',
    });
    prismaMock.user.findUnique.mockResolvedValue({ email: 'student@school.pt', studentIdentity: null } as any);
    prismaMock.workLog.findMany.mockResolvedValue([] as any);
    prismaMock.workLog.count.mockResolvedValue(0);

    const result = await getAggregatedDashboard('prof-1');
    expect(result.students[0].internshipStatus).toBe('NO_DATA');
  });

  it('computes internship status as ON_TRACK / SLIGHTLY_BEHIND / AT_RISK from ratios', async () => {
    prismaMock.settings.findUnique.mockResolvedValue({ id: 'default' } as any);
    prismaMock.professorStudentLink.findMany.mockResolvedValue([
      { studentId: 'student-on-track' },
      { studentId: 'student-behind' },
      { studentId: 'student-risk' },
    ] as any);

    (calculateDashboardStats as jest.Mock)
      .mockResolvedValueOnce({
        totalHoursLogged: 130,
        totalRequiredHours: 400,
        percentComplete: 32.5,
        remainingHours: 270,
        remainingWorkDays: 20,
        predictedEndDate: '2026-07-01',
        avgHoursPerDay: 6,
        daysWorked: 45,
        startDate: '2026-01-01',
      })
      .mockResolvedValueOnce({
        totalHoursLogged: 112,
        totalRequiredHours: 400,
        percentComplete: 28,
        remainingHours: 288,
        remainingWorkDays: 28,
        predictedEndDate: '2026-07-01',
        avgHoursPerDay: 5,
        daysWorked: 44,
        startDate: '2026-01-01',
      })
      .mockResolvedValueOnce({
        totalHoursLogged: 60,
        totalRequiredHours: 400,
        percentComplete: 15,
        remainingHours: 340,
        remainingWorkDays: 45,
        predictedEndDate: '2026-07-01',
        avgHoursPerDay: 3,
        daysWorked: 30,
        startDate: '2026-01-01',
      });

    prismaMock.user.findUnique
      .mockResolvedValueOnce({ email: 'on-track@school.pt', studentIdentity: null } as any)
      .mockResolvedValueOnce({ email: 'behind@school.pt', studentIdentity: null } as any)
      .mockResolvedValueOnce({ email: 'risk@school.pt', studentIdentity: null } as any);
    prismaMock.workLog.findMany.mockResolvedValue([] as any);
    prismaMock.workLog.count.mockResolvedValue(0);

    const result = await getAggregatedDashboard('prof-1');

    expect(result.students[0].internshipStatus).toBe('ON_TRACK');
    expect(result.students[1].internshipStatus).toBe('SLIGHTLY_BEHIND');
    expect(result.students[2].internshipStatus).toBe('AT_RISK');
  });
});
