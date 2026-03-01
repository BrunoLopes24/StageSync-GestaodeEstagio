import { PrismaClient } from '@prisma/client';
import { UpdateSettingsInput } from '../schemas/settings.schema';

const prisma = new PrismaClient();

const DEFAULT_SETTINGS = {
  id: 'default',
  totalRequiredHours: 640,
  dailyWorkHours: 7,
  workingDays: [1, 2, 3, 4, 5],
  startDate: new Date(),
};

export async function getSettings() {
  let settings = await prisma.settings.findUnique({ where: { id: 'default' } });

  if (!settings) {
    settings = await prisma.settings.create({
      data: DEFAULT_SETTINGS,
    });
  }

  return settings;
}

export async function updateSettings(data: UpdateSettingsInput) {
  const updateData: any = {};
  if (data.totalRequiredHours !== undefined) updateData.totalRequiredHours = data.totalRequiredHours;
  if (data.dailyWorkHours !== undefined) updateData.dailyWorkHours = data.dailyWorkHours;
  if (data.workingDays !== undefined) updateData.workingDays = data.workingDays;
  if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
  if (data.internshipTitle !== undefined) updateData.internshipTitle = data.internshipTitle;
  if (data.organizationName !== undefined) updateData.organizationName = data.organizationName;
  if (data.supervisorName !== undefined) updateData.supervisorName = data.supervisorName;
  if (data.studentName !== undefined) updateData.studentName = data.studentName;
  if (data.studentNumber !== undefined) updateData.studentNumber = data.studentNumber;

  return prisma.settings.upsert({
    where: { id: 'default' },
    update: updateData,
    create: { ...DEFAULT_SETTINGS, ...updateData },
  });
}
