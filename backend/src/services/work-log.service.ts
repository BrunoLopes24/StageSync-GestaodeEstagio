import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface WorkLogFilters {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export async function getWorkLogs(filters: WorkLogFilters) {
  const { from, to, page = 1, limit = 50 } = filters;
  const where: any = {};

  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const [data, total] = await Promise.all([
    prisma.workLog.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.workLog.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getWorkLogById(id: string) {
  return prisma.workLog.findUnique({ where: { id } });
}

export async function createWorkLog(data: { date: string; hours: number; notes?: string }) {
  return prisma.workLog.create({
    data: {
      date: new Date(data.date),
      hours: data.hours,
      notes: data.notes,
    },
  });
}

export async function updateWorkLog(id: string, data: { date?: string; hours?: number; notes?: string }) {
  const updateData: any = {};
  if (data.date) updateData.date = new Date(data.date);
  if (data.hours !== undefined) updateData.hours = data.hours;
  if (data.notes !== undefined) updateData.notes = data.notes;

  return prisma.workLog.update({ where: { id }, data: updateData });
}

export async function deleteWorkLog(id: string) {
  return prisma.workLog.delete({ where: { id } });
}

export async function getTotalHoursLogged(): Promise<number> {
  const result = await prisma.workLog.aggregate({
    _sum: { hours: true },
  });
  return result._sum.hours || 0;
}

export async function getWorkLogCount(): Promise<number> {
  return prisma.workLog.count();
}

export async function getAllWorkLogs() {
  return prisma.workLog.findMany({ orderBy: { date: 'asc' } });
}
