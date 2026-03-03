import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
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

  // Seed Institution
  const institution = await prisma.institution.upsert({
    where: { domain: 'ipt.pt' },
    update: {},
    create: {
      name: 'Instituto Politécnico de Tomar',
      domain: 'ipt.pt',
      isActive: true,
    },
  });
  console.log(`Seeded institution: ${institution.name}`);

  // ─── Student 27767 ────────────────────────────────────────
  const studentIdentity = await prisma.studentIdentity.upsert({
    where: {
      studentNumber_institutionId: {
        studentNumber: '27767',
        institutionId: institution.id,
      },
    },
    update: {
      institutionalEmail: 'aluno27767@ipt.pt',
      isActive: true,
    },
    create: {
      studentNumber: '27767',
      institutionalEmail: 'aluno27767@ipt.pt',
      isActive: true,
      needsPasswordSetup: true,
      institutionId: institution.id,
    },
  });
  console.log('Seeded student identity: 27767');

  // Ensure student 27767 has STUDENT role (downgrade if previously ADMIN)
  const existingStudent = await prisma.user.findUnique({
    where: { studentIdentityId: studentIdentity.id },
  });
  if (existingStudent && existingStudent.role !== 'STUDENT') {
    await prisma.user.update({
      where: { id: existingStudent.id },
      data: { role: 'STUDENT' },
    });
    console.log('Downgraded user 27767 role to STUDENT');
  } else if (existingStudent) {
    console.log('User 27767 already has STUDENT role');
  } else {
    console.log('User 27767 not yet created (will be STUDENT on first login)');
  }

  // ─── Admin Account ─────────────────────────────────────────
  const adminIdentity = await prisma.studentIdentity.upsert({
    where: {
      studentNumber_institutionId: {
        studentNumber: 'admin',
        institutionId: institution.id,
      },
    },
    update: {
      institutionalEmail: 'admin@ipt.pt',
      isActive: true,
      needsPasswordSetup: false,
    },
    create: {
      studentNumber: 'admin',
      institutionalEmail: 'admin@ipt.pt',
      isActive: true,
      needsPasswordSetup: false,
      institutionId: institution.id,
    },
  });
  console.log('Seeded admin identity');

  const adminPasswordHash = await argon2.hash('testeadmin');
  await prisma.user.upsert({
    where: { studentIdentityId: adminIdentity.id },
    update: {
      role: 'ADMIN',
      passwordHash: adminPasswordHash,
    },
    create: {
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      studentIdentityId: adminIdentity.id,
    },
  });
  console.log('Seeded admin user (role: ADMIN)');

  // Final guard: 27767 must never remain ADMIN after seed runs.
  await prisma.user.updateMany({
    where: {
      studentIdentityId: studentIdentity.id,
      role: 'ADMIN',
    },
    data: { role: 'STUDENT' },
  });

  // ─── Subscription ─────────────────────────────────────────
  await prisma.subscription.upsert({
    where: { institutionId: institution.id },
    update: { plan: 'PRO' },
    create: {
      institutionId: institution.id,
      plan: 'PRO',
      status: 'ACTIVE',
    },
  });
  console.log('Seeded subscription for institution');

  // ─── Assign orphaned work logs to student 27767 ───────────
  if (existingStudent) {
    const { count } = await prisma.workLog.updateMany({
      where: { userId: null },
      data: { userId: existingStudent.id },
    });
    if (count > 0) {
      console.log(`Assigned ${count} orphaned work logs to student 27767`);
    }
  }

  // ─── Sample Work Logs ─────────────────────────────────────
  const existingLogCount = await prisma.workLog.count();
  if (existingLogCount > 0) {
    console.log(`Skipping sample work logs seed: found ${existingLogCount} existing records`);
    console.log('Seeding complete!');
    return;
  }

  // Only create sample logs if student 27767 user exists
  const studentUser = existingStudent || await prisma.user.findUnique({
    where: { studentIdentityId: studentIdentity.id },
  });

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
    userId: string | null;
  }[] = [];
  const current = new Date(today);
  current.setDate(current.getDate() - 28);

  for (let i = 0; i < 28; i++) {
    const day = new Date(current);
    day.setDate(day.getDate() + i);
    const dayOfWeek = day.getDay();

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    sampleLogs.push({
      date: day,
      type: 'NORMAL',
      startTime: '09:00',
      endTime: '17:30',
      lunchStart: '13:00',
      lunchEnd: '14:00',
      calculatedHours: 7.5,
      company: 'Empresa Exemplo',
      taskDescription: i % 5 === 0 ? 'Tarefas de desenvolvimento' : 'Atividades de estágio',
      userId: studentUser?.id ?? null,
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
