import { PrismaClient, WorkLogType } from '@prisma/client';
import { getSettings } from './settings.service';
import { AppError } from '../middleware/error-handler';

const prisma = new PrismaClient();

export interface WorkLogFilters {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function computeHours(
  type: string,
  startTime?: string | null,
  endTime?: string | null,
  lunchStart?: string | null,
  lunchEnd?: string | null,
): number {
  if (type !== 'NORMAL' || !startTime || !endTime) return 0;
  let mins = toMinutes(endTime) - toMinutes(startTime);
  if (lunchStart && lunchEnd) {
    mins -= toMinutes(lunchEnd) - toMinutes(lunchStart);
  }
  return Math.max(0, Math.round((mins / 60) * 100) / 100);
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

export interface CreateWorkLogData {
  date: string;
  type?: WorkLogType;
  startTime?: string;
  endTime?: string;
  lunchStart?: string;
  lunchEnd?: string;
  company?: string;
  taskDescription?: string;
  justification?: string;
}

export async function createWorkLog(data: CreateWorkLogData) {
  const settings = await getSettings();
  const company = settings.organizationName?.trim();
  if (!company) {
    throw new AppError(400, 'Defina a organização em Definições para criar registos');
  }

  const type = data.type ?? 'NORMAL';
  const startTime = type === 'NORMAL' ? data.startTime : null;
  const endTime = type === 'NORMAL' ? data.endTime : null;
  const lunchStart = type === 'NORMAL' ? data.lunchStart : null;
  const lunchEnd = type === 'NORMAL' ? data.lunchEnd : null;
  const justification = type === 'JUSTIFIED_ABSENCE' ? data.justification : null;
  const taskDescription = type === 'NORMAL' ? (data.taskDescription ?? '').trim() : (data.taskDescription ?? '').trim();
  const calculatedHours = computeHours(type, startTime, endTime, lunchStart, lunchEnd);
  return prisma.workLog.create({
    data: {
      date: new Date(data.date),
      type,
      startTime,
      endTime,
      lunchStart,
      lunchEnd,
      calculatedHours,
      company,
      taskDescription,
      justification,
    },
  });
}

export async function updateWorkLog(id: string, data: Partial<CreateWorkLogData>) {
  const settings = await getSettings();
  const company = settings.organizationName?.trim();
  if (!company) {
    throw new AppError(400, 'Defina a organização em Definições para atualizar registos');
  }

  const existing = await prisma.workLog.findUnique({ where: { id } });
  const type = data.type ?? existing?.type ?? 'NORMAL';
  const startTime = type === 'NORMAL'
    ? (data.startTime !== undefined ? data.startTime : existing?.startTime)
    : null;
  const endTime = type === 'NORMAL'
    ? (data.endTime !== undefined ? data.endTime : existing?.endTime)
    : null;
  const lunchStart = type === 'NORMAL'
    ? (data.lunchStart !== undefined ? data.lunchStart : existing?.lunchStart)
    : null;
  const lunchEnd = type === 'NORMAL'
    ? (data.lunchEnd !== undefined ? data.lunchEnd : existing?.lunchEnd)
    : null;
  const justification = type === 'JUSTIFIED_ABSENCE'
    ? (data.justification !== undefined ? data.justification : existing?.justification)
    : null;
  const taskDescription = data.taskDescription !== undefined
    ? data.taskDescription
    : existing?.taskDescription;
  const calculatedHours = computeHours(type, startTime, endTime, lunchStart, lunchEnd);

  const updateData: any = { calculatedHours };
  if (data.date) updateData.date = new Date(data.date);
  if (data.type !== undefined) updateData.type = data.type;
  updateData.startTime = startTime;
  updateData.endTime = endTime;
  updateData.lunchStart = lunchStart;
  updateData.lunchEnd = lunchEnd;
  updateData.company = company;
  if (taskDescription !== undefined) updateData.taskDescription = taskDescription;
  updateData.justification = justification;

  return prisma.workLog.update({ where: { id }, data: updateData });
}

export async function deleteWorkLog(id: string) {
  return prisma.workLog.delete({ where: { id } });
}

export async function getTotalHoursLogged(): Promise<number> {
  const result = await prisma.workLog.aggregate({
    _sum: { calculatedHours: true },
    where: { type: 'NORMAL' },
  });
  return result._sum.calculatedHours || 0;
}

export async function getWorkLogCount(): Promise<number> {
  return prisma.workLog.count({ where: { type: 'NORMAL' } });
}

export async function getAllWorkLogs() {
  return prisma.workLog.findMany({ orderBy: { date: 'asc' } });
}

function csvEscape(value: string | null | undefined): string {
  const raw = value ?? '';
  if (raw.includes('"') || raw.includes(',') || raw.includes('\n') || raw.includes('\r')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  values.push(current);
  return values;
}

function parseCsv(content: string): Record<string, string>[] {
  const lines = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((line) => line.trim().length > 0);

  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = cells[idx] ?? '';
    });
    rows.push(row);
  }
  return rows;
}

function parseWorkLogType(type: string): WorkLogType {
  if (type === 'NORMAL' || type === 'HOLIDAY' || type === 'JUSTIFIED_ABSENCE') {
    return type;
  }
  throw new AppError(400, `Invalid work log type: ${type}`);
}

export async function exportWorkLogsCsv(): Promise<string> {
  const logs = await prisma.workLog.findMany({ orderBy: { date: 'asc' } });
  const header = [
    'date',
    'type',
    'startTime',
    'endTime',
    'lunchStart',
    'lunchEnd',
    'calculatedHours',
    'company',
    'taskDescription',
    'justification',
  ];

  const lines = [header.join(',')];
  for (const log of logs) {
    lines.push(
      [
        log.date.toISOString().split('T')[0],
        log.type,
        csvEscape(log.startTime),
        csvEscape(log.endTime),
        csvEscape(log.lunchStart),
        csvEscape(log.lunchEnd),
        String(log.calculatedHours),
        csvEscape(log.company),
        csvEscape(log.taskDescription),
        csvEscape(log.justification),
      ].join(','),
    );
  }
  return lines.join('\n');
}

export async function importWorkLogsCsv(content: string) {
  const rows = parseCsv(content);
  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const date = (row.date || '').trim();
    if (!date) {
      throw new AppError(400, 'CSV row missing required "date"');
    }
    const type = parseWorkLogType((row.type || 'NORMAL').trim());
    const payload: Partial<CreateWorkLogData> = {
      date,
      type,
      startTime: row.startTime?.trim() || undefined,
      endTime: row.endTime?.trim() || undefined,
      lunchStart: row.lunchStart?.trim() || undefined,
      lunchEnd: row.lunchEnd?.trim() || undefined,
      taskDescription: row.taskDescription?.trim() || undefined,
      justification: row.justification?.trim() || undefined,
    };

    const existing = await prisma.workLog.findUnique({
      where: { date: new Date(date) },
      select: { id: true },
    });

    if (existing) {
      await updateWorkLog(existing.id, payload);
      updated++;
    } else {
      await createWorkLog(payload as CreateWorkLogData);
      created++;
    }
  }

  return { created, updated, total: rows.length };
}
