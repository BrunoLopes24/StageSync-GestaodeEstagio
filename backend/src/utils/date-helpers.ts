import { format, isWeekend, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export function formatDateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function isWorkDay(date: Date, holidaySet: Set<string>, workingDays: number[] = [1, 2, 3, 4, 5]): boolean {
  const dayOfWeek = date.getDay();
  if (!workingDays.includes(dayOfWeek === 0 ? 7 : dayOfWeek)) return false;
  if (holidaySet.has(formatDateISO(date))) return false;
  return true;
}

export function getWeekRange(date: Date) {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

export function getMonthRange(year: number, month: number) {
  const date = new Date(year, month - 1, 1);
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}
