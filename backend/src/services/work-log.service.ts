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

/**
 * Parses full CSV content into rows of string arrays.
 * Handles quoted fields (with commas, newlines, escaped quotes).
 */
function parseCsvRows(content: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];

    if (ch === '"') {
      if (inQuotes && normalized[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if (ch === '\n' && !inQuotes) {
      row.push(current);
      current = '';
      if (row.some((cell) => cell.trim().length > 0)) {
        rows.push(row);
      }
      row = [];
    } else {
      current += ch;
    }
  }

  // Last field/row
  row.push(current);
  if (row.some((cell) => cell.trim().length > 0)) {
    rows.push(row);
  }

  return rows;
}

function parseCsv(content: string): Record<string, string>[] {
  const allRows = parseCsvRows(content);
  if (!allRows.length) return [];

  const headers = allRows[0].map((h) => mapHeader(h));
  const result: Record<string, string>[] = [];

  for (let i = 1; i < allRows.length; i++) {
    const cells = allRows[i];
    const row: Record<string, string> = {};

    // If more columns than headers, rejoin excess into last mapped header
    // (handles unquoted commas in trailing fields like taskDescription)
    if (cells.length > headers.length) {
      const taskDescIdx = headers.indexOf('taskDescription');
      if (taskDescIdx >= 0 && taskDescIdx < cells.length) {
        const excess = cells.length - headers.length;
        const merged = cells.slice(taskDescIdx, taskDescIdx + 1 + excess).join(',');
        cells.splice(taskDescIdx, 1 + excess, merged);
      }
    }

    headers.forEach((header, idx) => {
      row[header] = cells[idx] ?? '';
    });
    result.push(row);
  }
  return result;
}

const HEADER_ALIASES: Record<string, string> = {
  date: 'date',
  data: 'date',
  type: 'type',
  tipo: 'type',
  starttime: 'startTime',
  start_time: 'startTime',
  'hora início': 'startTime',
  'hora inicio': 'startTime',
  endtime: 'endTime',
  end_time: 'endTime',
  'hora fim': 'endTime',
  lunchstart: 'lunchStart',
  lunch_start: 'lunchStart',
  'início almoço': 'lunchStart',
  'inicio almoco': 'lunchStart',
  lunchend: 'lunchEnd',
  lunch_end: 'lunchEnd',
  'fim almoço': 'lunchEnd',
  'fim almoco': 'lunchEnd',
  calculatedhours: 'calculatedHours',
  calculated_hours: 'calculatedHours',
  hours: 'calculatedHours',
  horas: 'calculatedHours',
  company: 'company',
  empresa: 'company',
  taskdescription: 'taskDescription',
  task_description: 'taskDescription',
  description: 'taskDescription',
  'descrição': 'taskDescription',
  descricao: 'taskDescription',
  justification: 'justification',
  justificação: 'justification',
  justificacao: 'justification',
};

function mapHeader(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/[_\s]+/g, (m) => m.includes('_') ? '_' : ' ');
  return HEADER_ALIASES[key] || HEADER_ALIASES[key.replace(/[\s_]/g, '')] || raw.trim();
}

function normalizeWorkLogType(raw: string): WorkLogType | null {
  const normalized = raw.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (normalized === 'NORMAL' || normalized === 'HOLIDAY' || normalized === 'JUSTIFIED_ABSENCE') {
    return normalized;
  }
  // Try common variations
  if (normalized === 'FERIADO') return 'HOLIDAY';
  if (normalized === 'FALTA_JUSTIFICADA' || normalized === 'JUSTIFIED') return 'JUSTIFIED_ABSENCE';
  return null;
}

interface RowError {
  row: number;
  error: string;
}

function parseWorkLogType(type: string): WorkLogType {
  const result = normalizeWorkLogType(type);
  if (result) return result;
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

export interface ImportCsvResult {
  created: number;
  updated: number;
  skipped: number;
  total: number;
  errors: RowError[];
}

export async function importWorkLogsCsv(content: string): Promise<ImportCsvResult> {
  // Strip UTF-8 BOM if present
  const cleaned = content.replace(/^\uFEFF/, '');
  const rows = parseCsv(cleaned);
  if (!rows.length) {
    throw new AppError(400, 'CSV file is empty or has no data rows');
  }

  const settings = await getSettings();
  const settingsCompany = settings.organizationName?.trim();

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: RowError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // +2 because row 1 is header, data starts at row 2
    const row = rows[i];

    try {
      // Validate date (required)
      const date = (row.date || '').trim();
      if (!date) {
        errors.push({ row: rowNum, error: 'Missing required field: date' });
        skipped++;
        continue;
      }

      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        errors.push({ row: rowNum, error: `Invalid date format: "${date}"` });
        skipped++;
        continue;
      }

      // Validate and normalize type (required, defaults to NORMAL)
      const rawType = (row.type || 'NORMAL').trim();
      const type = normalizeWorkLogType(rawType);
      if (!type) {
        errors.push({ row: rowNum, error: `Invalid type: "${rawType}"` });
        skipped++;
        continue;
      }

      // Company: use CSV value, fall back to settings
      const rowCompany = row.company?.trim();
      const company = rowCompany || settingsCompany;
      if (!company) {
        errors.push({ row: rowNum, error: 'Missing company and no organization defined in settings' });
        skipped++;
        continue;
      }

      const startTime = row.startTime?.trim() || null;
      const endTime = row.endTime?.trim() || null;
      const lunchStart = row.lunchStart?.trim() || null;
      const lunchEnd = row.lunchEnd?.trim() || null;
      const taskDescription = row.taskDescription?.trim() || '';
      const justification = row.justification?.trim() || null;
      const calculatedHours = computeHours(type, startTime, endTime, lunchStart, lunchEnd);

      const existing = await prisma.workLog.findUnique({
        where: { date: parsedDate },
        select: { id: true },
      });

      if (existing) {
        await prisma.workLog.update({
          where: { id: existing.id },
          data: {
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
        updated++;
      } else {
        await prisma.workLog.create({
          data: {
            date: parsedDate,
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
        created++;
      }
    } catch (err: any) {
      errors.push({ row: rowNum, error: err.message || 'Unknown error' });
      skipped++;
    }
  }

  return { created, updated, skipped, total: rows.length, errors };
}
