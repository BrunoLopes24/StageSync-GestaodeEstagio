import { z } from 'zod';

export const updateSettingsSchema = z.object({
  totalRequiredHours: z.number().min(1).optional(),
  dailyWorkHours: z.number().min(0.5).max(24).optional(),
  workingDays: z.array(z.number().min(1).max(7)).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format').optional(),
  internshipTitle: z.string().nullable().optional(),
  organizationName: z.string().nullable().optional(),
  supervisorName: z.string().nullable().optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
