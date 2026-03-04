import { z } from 'zod';

export const professorLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().min(8, 'Access code must be at least 8 characters'),
});

export const professorInviteSchema = z.object({
  professorEmail: z.string().email('Invalid professor email address'),
});

export type ProfessorLoginInput = z.infer<typeof professorLoginSchema>;
export type ProfessorInviteInput = z.infer<typeof professorInviteSchema>;
