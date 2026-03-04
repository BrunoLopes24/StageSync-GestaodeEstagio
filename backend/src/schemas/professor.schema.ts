import { z } from 'zod';

export const professorLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().min(8, 'Access code must be at least 8 characters'),
});

export type ProfessorLoginInput = z.infer<typeof professorLoginSchema>;
