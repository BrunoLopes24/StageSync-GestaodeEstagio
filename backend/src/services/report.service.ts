import { PrismaClient } from '@prisma/client';
import { format, getISOWeek } from 'date-fns';
import { getWeekRange, getMonthRange } from '../utils/date-helpers';

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
