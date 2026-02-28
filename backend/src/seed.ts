import { PrismaClient } from '@prisma/client';
import { getPortugueseHolidays } from './utils/portuguese-holidays';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Generate holidays for current and next year
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1];

  for (const year of years) {
    const holidays = getPortugueseHolidays(year);
    for (const holiday of holidays) {
      await prisma.holiday.upsert({
        where: { date: holiday.date },
        update: { name: holiday.name, movable: holiday.movable, year },
        create: {
          date: holiday.date,
          name: holiday.name,
          movable: holiday.movable,
          year,
        },
      });
    }
    console.log(`Generated ${holidays.length} holidays for ${year}`);
  }

  // Create default settings
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      totalRequiredHours: 640,
      dailyWorkHours: 7,
      workingDays: [1, 2, 3, 4, 5],
      startDate: new Date(),
    },
  });
  console.log('Default settings created');

  // Create sample work logs (last 4 weeks of data)
  const today = new Date();
  const sampleLogs: { date: Date; hours: number; notes: string | null }[] = [];
  const current = new Date(today);
  current.setDate(current.getDate() - 28);

  for (let i = 0; i < 28; i++) {
    const day = new Date(current);
    day.setDate(day.getDate() + i);
    const dayOfWeek = day.getDay();

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // Random hours between 6 and 8
    const hours = Math.round((6 + Math.random() * 2) * 10) / 10;
    sampleLogs.push({
      date: day,
      hours,
      notes: i % 5 === 0 ? 'Tarefas de desenvolvimento' : null,
    });
  }

  for (const log of sampleLogs) {
    await prisma.workLog.upsert({
      where: { date: log.date },
      update: { hours: log.hours, notes: log.notes },
      create: log,
    });
  }
  console.log(`Created ${sampleLogs.length} sample work logs`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
