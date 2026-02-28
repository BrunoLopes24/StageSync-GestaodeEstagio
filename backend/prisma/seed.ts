import { PrismaClient } from '@prisma/client';
import { getPortugueseHolidays } from '../src/utils/portuguese-holidays';

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
  const sampleLogs: {
    date: Date;
    type: 'NORMAL';
    startTime: string;
    endTime: string;
    lunchStart: string;
    lunchEnd: string;
    calculatedHours: number;
    company: string;
    taskDescription: string;
  }[] = [];
  const current = new Date(today);
  current.setDate(current.getDate() - 28);

  for (let i = 0; i < 28; i++) {
    const day = new Date(current);
    day.setDate(day.getDate() + i);
    const dayOfWeek = day.getDay();

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const startTime = '09:00';
    const endTime = '17:30';
    const lunchStart = '13:00';
    const lunchEnd = '14:00';
    const calculatedHours = 7.5;

    sampleLogs.push({
      date: day,
      type: 'NORMAL',
      startTime,
      endTime,
      lunchStart,
      lunchEnd,
      calculatedHours,
      company: 'Sample Company',
      taskDescription: i % 5 === 0 ? 'Development tasks' : 'Internship activities',
    });
  }

  for (const log of sampleLogs) {
    await prisma.workLog.upsert({
      where: { date: log.date },
      update: {
        type: log.type,
        startTime: log.startTime,
        endTime: log.endTime,
        lunchStart: log.lunchStart,
        lunchEnd: log.lunchEnd,
        calculatedHours: log.calculatedHours,
        company: log.company,
        taskDescription: log.taskDescription,
        justification: null,
      },
      create: {
        ...log,
        justification: null,
      },
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
