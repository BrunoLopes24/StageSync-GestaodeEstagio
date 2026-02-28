import { PrismaClient } from '@prisma/client';
import { getPortugueseHolidays } from '../utils/portuguese-holidays';
import { formatDateISO } from '../utils/date-helpers';

const prisma = new PrismaClient();

export async function getHolidays(year: number) {
  return prisma.holiday.findMany({
    where: { year },
    orderBy: { date: 'asc' },
  });
}

export async function generateHolidays(year: number) {
  const holidays = getPortugueseHolidays(year);

  const results = [];
  for (const holiday of holidays) {
    const result = await prisma.holiday.upsert({
      where: { date: holiday.date },
      update: { name: holiday.name, movable: holiday.movable, year },
      create: {
        date: holiday.date,
        name: holiday.name,
        movable: holiday.movable,
        year,
      },
    });
    results.push(result);
  }

  return results;
}

export async function addCustomHoliday(data: { date: string; name: string }) {
  const date = new Date(data.date);
  return prisma.holiday.create({
    data: {
      date,
      name: data.name,
      movable: false,
      year: date.getFullYear(),
    },
  });
}

export async function deleteHoliday(id: string) {
  return prisma.holiday.delete({ where: { id } });
}

export async function getHolidayDatesSet(...years: number[]): Promise<Set<string>> {
  const holidays = await prisma.holiday.findMany({
    where: { year: { in: years } },
    select: { date: true },
  });
  return new Set(holidays.map((h) => formatDateISO(h.date)));
}
