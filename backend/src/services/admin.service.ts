import { prisma } from '../lib/prisma';

interface StudentFilters {
  active?: boolean;
  page?: number;
  limit?: number;
}

interface WorkLogFilters {
  status?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export async function getAdminDashboard() {
  const [totalStudents, totalHoursResult, pendingApprovals, activeSessions] =
    await Promise.all([
      prisma.studentIdentity.count({ where: { isActive: true, studentNumber: { not: 'admin' } } }),
      prisma.workLog.aggregate({ _sum: { calculatedHours: true } }),
      prisma.workLog.count({ where: { status: 'PENDING' } }),
      prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
    ]);

  return {
    totalStudents,
    totalHoursLogged: totalHoursResult._sum.calculatedHours || 0,
    pendingApprovals,
    activeSessions,
  };
}

export async function listStudents(filters: StudentFilters) {
  const { active, page = 1, limit = 50 } = filters;

  const baseFilter = { studentNumber: { not: 'admin' } };
  const where = active !== undefined ? { ...baseFilter, isActive: active } : baseFilter;

  const [students, total] = await Promise.all([
    prisma.studentIdentity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            role: true,
            lastLoginAt: true,
          },
        },
        institution: {
          select: { name: true },
        },
      },
      orderBy: { studentNumber: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.studentIdentity.count({ where }),
  ]);

  // Enrich with work log summary for each student with a user
  const enriched = await Promise.all(
    students.map(async (s) => {
      let totalHours = 0;
      let logCount = 0;

      if (s.user) {
        const agg = await prisma.workLog.aggregate({
          where: { userId: s.user.id },
          _sum: { calculatedHours: true },
          _count: true,
        });
        totalHours = agg._sum.calculatedHours || 0;
        logCount = agg._count;
      }

      return {
        id: s.id,
        studentNumber: s.studentNumber,
        email: s.institutionalEmail,
        isActive: s.isActive,
        institution: s.institution.name,
        userId: s.user?.id || null,
        role: s.user?.role || null,
        lastLoginAt: s.user?.lastLoginAt || null,
        totalHours,
        logCount,
      };
    }),
  );

  return { students: enriched, total, page, limit };
}

export async function listAllWorkLogs(filters: WorkLogFilters) {
  const { status, userId, page = 1, limit = 50 } = filters;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (userId) where.userId = userId;

  const [logs, total] = await Promise.all([
    prisma.workLog.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.workLog.count({ where }),
  ]);

  return { logs, total, page, limit };
}

export async function approveWorkLog(workLogId: string) {
  return prisma.workLog.update({
    where: { id: workLogId },
    data: {
      status: 'APPROVED',
      rejectionReason: null,
    },
  });
}

export async function rejectWorkLog(workLogId: string, reason?: string) {
  return prisma.workLog.update({
    where: { id: workLogId },
    data: {
      status: 'REJECTED',
      rejectionReason: reason || null,
    },
  });
}

export async function listActiveSessions() {
  return prisma.session.findMany({
    where: { expiresAt: { gt: new Date() } },
    include: {
      user: {
        select: {
          id: true,
          role: true,
          studentIdentity: {
            select: {
              studentNumber: true,
              institutionalEmail: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function revokeSession(sessionId: string) {
  return prisma.session.delete({
    where: { id: sessionId },
  });
}
