import { PrismaClient } from '@prisma/client';
import { format, getISOWeek } from 'date-fns';
import { getWeekRange, getMonthRange } from '../utils/date-helpers';
import { getSettings } from './settings.service';

const prisma = new PrismaClient();

export interface WeeklySummary {
  weekNumber: number;
  startDate: string;
  endDate: string;
  totalHours: number;
  daysWorked: number;
  avgHoursPerDay: number;
  dailyBreakdown: { date: string; hours: number; taskDescription: string | null }[];
}

export interface MonthlySummary {
  month: string;
  totalHours: number;
  daysWorked: number;
  avgHoursPerDay: number;
  weeklyBreakdown: { week: number; hours: number; days: number }[];
}

function escapePdfText(text: string): string {
  const latin1 = Buffer.from(text.normalize('NFC'), 'latin1');
  let encoded = '';

  for (const byte of latin1) {
    if (byte === 0x28 || byte === 0x29 || byte === 0x5c) {
      encoded += `\\${String.fromCharCode(byte)}`;
    } else if (byte < 32 || byte > 126) {
      encoded += `\\${byte.toString(8).padStart(3, '0')}`;
    } else {
      encoded += String.fromCharCode(byte);
    }
  }

  return encoded;
}

function wrapText(text: string, maxChars = 92): string[] {
  if (!text) return [''];
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildSimplePdf(lines: string[]): Buffer {
  const header = '%PDF-1.4\n';
  const objects: string[] = [];
  const offsets: number[] = [0];

  const content = [
    'BT',
    '/F1 11 Tf',
    '50 790 Td',
    '14 TL',
    ...lines.map((line, idx) => `${idx === 0 ? '' : 'T* '}(${escapePdfText(line)}) Tj`),
    'ET',
  ].join('\n');

  objects.push('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n');
  objects.push('2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n');
  objects.push(
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n',
  );
  objects.push('4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >> endobj\n');
  objects.push(`5 0 obj << /Length ${Buffer.byteLength(content, 'utf8')} >> stream\n${content}\nendstream\nendobj\n`);

  let body = '';
  for (const obj of objects) {
    offsets.push(header.length + body.length);
    body += obj;
  }

  const xrefStart = header.length + body.length;
  const xrefEntries = offsets
    .map((offset, idx) => (idx === 0 ? '0000000000 65535 f ' : `${String(offset).padStart(10, '0')} 00000 n `))
    .join('\n');
  const xref = `xref\n0 ${offsets.length}\n${xrefEntries}\n`;
  const trailer = `trailer << /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(`${header}${body}${xref}${trailer}`, 'utf8');
}

function normalizeDescription(text: string): string {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';
  const normalized = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
  return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
}

function buildPhaseParagraph(
  phaseLabel: string,
  phaseLogs: { date: Date; taskDescription: string }[],
): string {
  if (!phaseLogs.length) return '';

  const uniqueDescriptions: string[] = [];
  const seen = new Set<string>();
  for (const log of phaseLogs) {
    const normalized = normalizeDescription(log.taskDescription);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueDescriptions.push(normalized);
    }
  }

  if (!uniqueDescriptions.length) return '';

  const connectors = [
    'num primeiro momento',
    'de seguida',
    'num momento posterior',
    'por fim',
  ];

  const narrative = uniqueDescriptions
    .map((description, index) => {
      const connector = connectors[Math.min(index, connectors.length - 1)];
      return `${connector}, ${description}`;
    })
    .join(' ');

  const start = format(phaseLogs[0].date, 'dd/MM/yyyy');
  const end = format(phaseLogs[phaseLogs.length - 1].date, 'dd/MM/yyyy');

  return `Na ${phaseLabel} (${start} a ${end}), os registos de descrição evidenciam que ${narrative}`;
}

function buildLearningNarrative(logs: { date: Date; taskDescription: string }[]): string[] {
  if (!logs.length) {
    return ['Não existem descrições suficientes para descrever a evolução da aprendizagem com base nos registos diários.'];
  }

  const ordered = [...logs].sort((a, b) => a.date.getTime() - b.date.getTime());
  const size = ordered.length;
  const firstCut = Math.max(1, Math.floor(size / 3));
  const secondCut = Math.max(firstCut + 1, Math.floor((size * 2) / 3));

  const initialPhase = ordered.slice(0, firstCut);
  const intermediatePhase = ordered.slice(firstCut, secondCut);
  const recentPhase = ordered.slice(secondCut);

  const paragraphs = [
    buildPhaseParagraph('fase inicial', initialPhase),
    buildPhaseParagraph('fase intermédia', intermediatePhase),
    buildPhaseParagraph('fase mais recente', recentPhase),
  ].filter((p) => p.length > 0);

  return paragraphs.length
    ? paragraphs
    : ['Não existem descrições suficientes para descrever a evolução da aprendizagem com base nos registos diários.'];
}

function buildAttendanceSummary(logs: { date: Date; calculatedHours: number }[]): {
  paragraphA: string;
  paragraphB: string;
} {
  if (!logs.length) {
    return {
      paragraphA: 'Sem registos suficientes para avaliar assiduidade no período em análise.',
      paragraphB: 'Sem registos suficientes para interpretar continuidade de presença.',
    };
  }

  const first = logs[0].date;
  const last = logs[logs.length - 1].date;
  const MS_DAY = 24 * 60 * 60 * 1000;
  let expectedWorkingDays = 0;
  for (let cursor = new Date(first); cursor <= last; cursor = new Date(cursor.getTime() + MS_DAY)) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) expectedWorkingDays++;
  }

  const presenceRate = expectedWorkingDays > 0 ? logs.length / expectedWorkingDays : 0;
  const consistencyText =
    presenceRate >= 0.85
      ? 'consistência elevada'
      : presenceRate >= 0.65
        ? 'consistência moderada'
        : 'consistência irregular';

  const paragraphA = `No intervalo entre ${format(first, 'dd/MM/yyyy')} e ${format(last, 'dd/MM/yyyy')}, foram registados ${logs.length} dias de presença em ${expectedWorkingDays} dias úteis observáveis, correspondendo a uma taxa de presença aproximada de ${(presenceRate * 100).toFixed(1)}%.`;
  const paragraphB = `A leitura global da assiduidade indica ${consistencyText}, com continuidade de presença ao longo do período e evolução progressiva da adaptação às rotinas de trabalho.`;

  return {
    paragraphA,
    paragraphB,
  };
}

export async function generateMidtermReportPdf() {
  const settings = await getSettings();
  const logs = await prisma.workLog.findMany({
    where: { type: 'NORMAL' },
    orderBy: { date: 'asc' },
    select: { date: true, taskDescription: true, calculatedHours: true },
  });

  const logsWithDescription = logs.filter((log) => log.taskDescription && log.taskDescription.trim().length > 0);
  const learningNarrative = buildLearningNarrative(logsWithDescription as { date: Date; taskDescription: string }[]);
  const attendanceSummary = buildAttendanceSummary(
    logs.map((log) => ({ date: log.date, calculatedHours: log.calculatedHours })),
  );

  const programName = settings.internshipTitle?.trim() || 'Não definido';
  const studentName = settings.studentName?.trim() || 'Não definido';
  const studentNumber = settings.studentNumber?.trim() || 'Não definido';
  const internshipEntity = settings.organizationName?.trim() || 'Não definido';

  const lines: string[] = [
    'RELATÓRIO INTERCALAR',
    '',
    `Programa: ${programName}`,
    `Nome do Estudante: ${studentName}`,
    `Número do Estudante: ${studentNumber}`,
    `Entidade de Estágio: ${internshipEntity}`,
    '',
    'Evolução da Aprendizagem',
    '',
    ...learningNarrative.flatMap((paragraph, index) => [
      ...wrapText(paragraph, 88),
      ...(index < learningNarrative.length - 1 ? [''] : []),
    ]),
    '',
    'Assiduidade',
    '',
    ...wrapText(attendanceSummary.paragraphA, 88),
    '',
    ...wrapText(attendanceSummary.paragraphB, 88),
  ];

  return buildSimplePdf(lines);
}

export async function getWeeklySummary(dateStr: string): Promise<WeeklySummary> {
  const date = new Date(dateStr);
  const { start, end } = getWeekRange(date);

  const logs = await prisma.workLog.findMany({
    where: {
      date: { gte: start, lte: end },
      type: 'NORMAL',
    },
    orderBy: { date: 'asc' },
  });

  const totalHours = logs.reduce((sum, log) => sum + log.calculatedHours, 0);
  const daysWorked = logs.length;

  return {
    weekNumber: getISOWeek(date),
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
    totalHours: Math.round(totalHours * 100) / 100,
    daysWorked,
    avgHoursPerDay: daysWorked > 0 ? Math.round((totalHours / daysWorked) * 100) / 100 : 0,
    dailyBreakdown: logs.map((log) => ({
      date: format(log.date, 'yyyy-MM-dd'),
      hours: log.calculatedHours,
      taskDescription: log.taskDescription,
    })),
  };
}

export async function getMonthlySummary(monthStr: string): Promise<MonthlySummary> {
  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10);
  const { start, end } = getMonthRange(year, month);

  const logs = await prisma.workLog.findMany({
    where: {
      date: { gte: start, lte: end },
      type: 'NORMAL',
    },
    orderBy: { date: 'asc' },
  });

  const totalHours = logs.reduce((sum, log) => sum + log.calculatedHours, 0);
  const daysWorked = logs.length;

  const weekMap = new Map<number, { hours: number; days: number }>();
  for (const log of logs) {
    const week = getISOWeek(log.date);
    const existing = weekMap.get(week) || { hours: 0, days: 0 };
    existing.hours += log.calculatedHours;
    existing.days += 1;
    weekMap.set(week, existing);
  }

  return {
    month: monthStr,
    totalHours: Math.round(totalHours * 100) / 100,
    daysWorked,
    avgHoursPerDay: daysWorked > 0 ? Math.round((totalHours / daysWorked) * 100) / 100 : 0,
    weeklyBreakdown: Array.from(weekMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([week, data]) => ({
        week,
        hours: Math.round(data.hours * 100) / 100,
        days: data.days,
      })),
  };
}
