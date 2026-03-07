import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { getPortugueseHolidays } from '../src/utils/portuguese-holidays';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Institution + Student Identity + User ───────────────
  const institution = await prisma.institution.upsert({
    where: { domain: 'estg.ipvc.pt' },
    update: {},
    create: {
      name: 'ESTG-IPVC',
      domain: 'estg.ipvc.pt',
      isActive: true,
    },
  });
  console.log(`Institution: ${institution.name}`);

  const studentNumber = '27767';
  const email = `${studentNumber}@estg.ipvc.pt`;
  const passwordHash = await argon2.hash('password123');

  const identity = await prisma.studentIdentity.upsert({
    where: { institutionalEmail: email },
    update: {},
    create: {
      studentNumber,
      institutionalEmail: email,
      isActive: true,
      needsPasswordSetup: false,
      institutionId: institution.id,
    },
  });

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      role: 'STUDENT',
      studentIdentityId: identity.id,
    },
  });
  console.log(`Student user created: ${studentNumber} / password123`);

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

  const existingLogCount = await prisma.workLog.count();
  if (existingLogCount > 0) {
    console.log(`Skipping sample work logs seed: found ${existingLogCount} existing records`);
    console.log('Seeding complete!');
    return;
  }

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

  await prisma.workLog.createMany({
    data: sampleLogs.map((log) => ({ ...log, justification: null })),
  });
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
