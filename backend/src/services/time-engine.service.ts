import { addDays } from 'date-fns';
import { isWorkDay, formatDateISO } from '../utils/date-helpers';
import { getHolidayDatesSet } from './holiday.service';
import { getSettings } from './settings.service';
import { getTotalHoursLogged, getWorkLogCount } from './work-log.service';

export interface DashboardStats {
  totalHoursLogged: number;
  totalRequiredHours: number;
  percentComplete: number;
  remainingHours: number;
  remainingWorkDays: number;
  predictedEndDate: string | null;
  avgHoursPerDay: number;
  daysWorked: number;
  startDate: string;
}

export async function calculateDashboardStats(): Promise<DashboardStats> {
  const settings = await getSettings();
  const totalHoursLogged = await getTotalHoursLogged();
  const daysWorked = await getWorkLogCount();

  const totalRequiredHours = settings.totalRequiredHours;
  const remainingHours = Math.max(0, totalRequiredHours - totalHoursLogged);
  const percentComplete = totalRequiredHours > 0
    ? Math.min(100, (totalHoursLogged / totalRequiredHours) * 100)
    : 0;

  const avgHoursPerDay = daysWorked > 0
    ? totalHoursLogged / daysWorked
    : settings.dailyWorkHours;

  // Defend against invalid persisted settings (e.g. empty working days or zero hours/day).
  const normalizedWorkingDays = Array.isArray(settings.workingDays)
    ? Array.from(new Set(
      (settings.workingDays as number[])
        .filter((day) => Number.isInteger(day) && day >= 1 && day <= 7),
    ))
    : [];
  const workingDays = normalizedWorkingDays.length > 0 ? normalizedWorkingDays : [1, 2, 3, 4, 5];
  const safeAvgHoursPerDay = Number.isFinite(avgHoursPerDay) && avgHoursPerDay > 0
    ? avgHoursPerDay
    : (settings.dailyWorkHours > 0 ? settings.dailyWorkHours : 7);

  let predictedEndDate: string | null = null;
  let remainingWorkDays = 0;

  if (remainingHours > 0) {
    remainingWorkDays = Math.ceil(remainingHours / safeAvgHoursPerDay);

    const today = new Date();
    const currentYear = today.getFullYear();
    const holidaySet = await getHolidayDatesSet(currentYear, currentYear + 1);

    let count = 0;
    let cursor = new Date(today);
    const maxIterations = Math.max(remainingWorkDays * 14, 366 * 3);
    let iterations = 0;

    while (count < remainingWorkDays && iterations < maxIterations) {
      cursor = addDays(cursor, 1);
      if (isWorkDay(cursor, holidaySet, workingDays)) {
        count++;
      }
      iterations++;
    }

    if (count === remainingWorkDays) {
      predictedEndDate = formatDateISO(cursor);
    }
  }

  return {
    totalHoursLogged: Math.round(totalHoursLogged * 100) / 100,
    totalRequiredHours,
    percentComplete: Math.round(percentComplete * 100) / 100,
    remainingHours: Math.round(remainingHours * 100) / 100,
    remainingWorkDays,
    predictedEndDate,
    avgHoursPerDay: Math.round(safeAvgHoursPerDay * 100) / 100,
    daysWorked,
    startDate: formatDateISO(settings.startDate),
  };
}
