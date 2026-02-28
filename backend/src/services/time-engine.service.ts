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

  const workingDays = (settings.workingDays as number[]) || [1, 2, 3, 4, 5];

  let predictedEndDate: string | null = null;
  let remainingWorkDays = 0;

  if (remainingHours > 0) {
    remainingWorkDays = Math.ceil(remainingHours / avgHoursPerDay);

    const today = new Date();
    const currentYear = today.getFullYear();
    const holidaySet = await getHolidayDatesSet(currentYear, currentYear + 1);

    let count = 0;
    let cursor = new Date(today);

    while (count < remainingWorkDays) {
      cursor = addDays(cursor, 1);
      if (isWorkDay(cursor, holidaySet, workingDays)) {
        count++;
      }
    }

    predictedEndDate = formatDateISO(cursor);
  }

  return {
    totalHoursLogged: Math.round(totalHoursLogged * 100) / 100,
    totalRequiredHours,
    percentComplete: Math.round(percentComplete * 100) / 100,
    remainingHours: Math.round(remainingHours * 100) / 100,
    remainingWorkDays,
    predictedEndDate,
    avgHoursPerDay: Math.round(avgHoursPerDay * 100) / 100,
    daysWorked,
    startDate: formatDateISO(settings.startDate),
  };
}
