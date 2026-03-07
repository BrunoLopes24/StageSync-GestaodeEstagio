import { prisma } from '../lib/prisma';
import { calculateDashboardStats, DashboardStats } from './time-engine.service';

// ─── Internship Status ──────────────────────────────────

type InternshipStatus = 'ON_TRACK' | 'SLIGHTLY_BEHIND' | 'AT_RISK' | 'COMPLETED' | 'NO_DATA';
type StudentProfileSettings = {
  studentNumber?: string | null;
  studentName?: string | null;
  studentEmail?: string | null;
};

function computeInternshipStatus(stats: DashboardStats): InternshipStatus {
  if (stats.percentComplete >= 100) return 'COMPLETED';

  const start = new Date(stats.startDate);
  const now = new Date();
  const elapsed = now.getTime() - start.getTime();

  if (!stats.predictedEndDate || elapsed <= 0) return 'NO_DATA';

  const predictedEnd = new Date(stats.predictedEndDate);
  const totalDuration = predictedEnd.getTime() - start.getTime();
  const expectedPercent = totalDuration > 0
    ? Math.min(100, (elapsed / totalDuration) * 100)
    : stats.percentComplete;

  const ratio = expectedPercent > 0 ? stats.percentComplete / expectedPercent : 1;

  if (ratio >= 0.9) return 'ON_TRACK';
  if (ratio >= 0.7) return 'SLIGHTLY_BEHIND';
  return 'AT_RISK';
}

export {
  generateAccessCode,
  getActiveCodeStatus,
  revokeAccessCode,
  getLinkedProfessor,
  revokeLink,
  professorLogin,
} from './professor-access.service';

// ─── Professor: List Supervised Students ────────────────

export async function getSupervisedStudents(professorUserId: string) {
  const links = await prisma.professorStudentLink.findMany({
    where: { professorId: professorUserId, isActive: true },
    include: {
      student: {
        include: {
          studentIdentity: {
            select: {
              studentNumber: true,
              institutionalEmail: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return links.map((link) => ({
    studentId: link.studentId,
    studentNumber: link.student.studentIdentity?.studentNumber ?? null,
    email: link.student.email,
    linkedAt: link.createdAt,
  }));
}

// ─── Professor: Student Dashboard Stats ─────────────────

export async function getStudentDashboard(studentUserId: string): Promise<{
  stats: DashboardStats;
  student: {
    studentNumber: string | null;
    email: string;
    name: string | null;
  };
}> {
  const [stats, user, settings] = await Promise.all([
    calculateDashboardStats(studentUserId),
    prisma.user.findUnique({
      where: { id: studentUserId },
      include: {
        studentIdentity: {
          select: { studentNumber: true },
        },
      },
    }),
    prisma.settings.findUnique({ where: { id: 'default' } }),
  ]);

  return {
    stats,
    student: {
      studentNumber: user?.studentIdentity?.studentNumber ?? null,
      email: user?.email ?? '',
      name: settings?.studentNumber === user?.studentIdentity?.studentNumber
        ? (settings?.studentName ?? null)
        : null,
    },
  };
}

// ─── Professor: Student Work Logs (Read-Only) ───────────

export async function getStudentWorkLogs(
  studentUserId: string,
  filters: { page?: number; limit?: number },
) {
  const { page = 1, limit = 50 } = filters;

  const [logs, total] = await Promise.all([
    prisma.workLog.findMany({
      where: { userId: studentUserId },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.workLog.count({ where: { userId: studentUserId } }),
  ]);

  return { logs, total, page, limit };
}

// ─── Professor: Aggregated Dashboard ────────────────────

export async function getAggregatedDashboard(professorUserId: string) {
  const settings = await prisma.settings.findUnique({ where: { id: 'default' } });
  const sharedStudentProfile = (settings ?? {}) as StudentProfileSettings;

  const links = await prisma.professorStudentLink.findMany({
    where: { professorId: professorUserId, isActive: true },
    select: { studentId: true },
  });

  const studentIds = links.map((l) => l.studentId);

  if (studentIds.length === 0) {
    return {
      totalStudents: 0,
      students: [],
    };
  }

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const students = await Promise.all(
    studentIds.map(async (studentId) => {
      const [stats, user, recentLogsRaw, weeklyLogCount] = await Promise.all([
        calculateDashboardStats(studentId),
        prisma.user.findUnique({
          where: { id: studentId },
          include: {
            studentIdentity: {
              select: { studentNumber: true },
            },
          },
        }),
        prisma.workLog.findMany({
          where: { userId: studentId },
          orderBy: { date: 'desc' },
          take: 3,
          select: {
            id: true,
            date: true,
            taskDescription: true,
            calculatedHours: true,
          },
        }),
        prisma.workLog.count({
          where: { userId: studentId, date: { gte: oneWeekAgo } },
        }),
      ]);

      const recentLogs = recentLogsRaw.map((log) => ({
        id: log.id,
        date: log.date.toISOString(),
        taskDescription: log.taskDescription,
        calculatedHours: log.calculatedHours,
      }));

      const lastActivityDate = recentLogs.length > 0 ? recentLogs[0].date : null;

      const now = new Date();
      const start = new Date(stats.startDate);
      const daysSinceStart = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      const weeksSinceStart = Math.max(1, daysSinceStart / 7);
      const averageWeeklyHours = Math.round((stats.totalHoursLogged / weeksSinceStart) * 10) / 10;

      return {
        studentId,
        studentNumber: user?.studentIdentity?.studentNumber ?? null,
        email: (sharedStudentProfile.studentNumber === user?.studentIdentity?.studentNumber
          && sharedStudentProfile.studentEmail)
          ? sharedStudentProfile.studentEmail
          : (user?.email ?? ''),
        name: sharedStudentProfile.studentNumber === user?.studentIdentity?.studentNumber
          ? (sharedStudentProfile.studentName ?? null)
          : null,
        totalHoursLogged: stats.totalHoursLogged,
        totalRequiredHours: stats.totalRequiredHours,
        percentComplete: stats.percentComplete,
        remainingHours: stats.remainingHours,
        remainingWorkDays: stats.remainingWorkDays,
        predictedEndDate: stats.predictedEndDate,
        avgHoursPerDay: stats.avgHoursPerDay,
        daysWorked: stats.daysWorked,
        startDate: stats.startDate,
        recentLogs,
        lastActivityDate,
        weeklyLogCount,
        internshipStatus: computeInternshipStatus(stats),
        averageWeeklyHours,
      };
    }),
  );

  return {
    totalStudents: students.length,
    students,
  };
}
