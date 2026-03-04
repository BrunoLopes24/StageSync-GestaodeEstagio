import { prisma } from '../lib/prisma';
import { calculateDashboardStats, DashboardStats } from './time-engine.service';

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

  const students = await Promise.all(
    studentIds.map(async (studentId) => {
      const [stats, user] = await Promise.all([
        calculateDashboardStats(studentId),
        prisma.user.findUnique({
          where: { id: studentId },
          include: {
            studentIdentity: {
              select: { studentNumber: true },
            },
          },
        }),
      ]);

      return {
        studentId,
        studentNumber: user?.studentIdentity?.studentNumber ?? null,
        email: user?.email ?? '',
        name: settings?.studentNumber === user?.studentIdentity?.studentNumber
          ? (settings?.studentName ?? null)
          : null,
        totalHoursLogged: stats.totalHoursLogged,
        percentComplete: stats.percentComplete,
        predictedEndDate: stats.predictedEndDate,
        avgHoursPerDay: stats.avgHoursPerDay,
      };
    }),
  );

  return {
    totalStudents: students.length,
    students,
  };
}
