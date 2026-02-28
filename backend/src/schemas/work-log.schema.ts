import { z } from 'zod';

export const createWorkLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  hours: z.number().min(0.5).max(24),
  notes: z.string().optional(),
});

export const updateWorkLogSchema = createWorkLogSchema.partial();

export type CreateWorkLogInput = z.infer<typeof createWorkLogSchema>;
export type UpdateWorkLogInput = z.infer<typeof updateWorkLogSchema>;
