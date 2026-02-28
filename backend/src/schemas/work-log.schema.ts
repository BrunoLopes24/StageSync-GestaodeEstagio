import { z } from 'zod';

const timeRegex = /^\d{2}:\d{2}$/;

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export const createWorkLogSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
    type: z.enum(['NORMAL', 'HOLIDAY', 'JUSTIFIED_ABSENCE']).default('NORMAL'),
    startTime: z.string().regex(timeRegex, 'Formato HH:MM').optional(),
    endTime: z.string().regex(timeRegex, 'Formato HH:MM').optional(),
    lunchStart: z.string().regex(timeRegex, 'Formato HH:MM').optional(),
    lunchEnd: z.string().regex(timeRegex, 'Formato HH:MM').optional(),
    company: z.string().min(1, 'Empresa é obrigatória'),
    taskDescription: z.string().min(1, 'Descrição é obrigatória'),
    justification: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'NORMAL') {
      if (!data.startTime) {
        ctx.addIssue({ code: 'custom', path: ['startTime'], message: 'Hora de entrada obrigatória' });
      }
      if (!data.endTime) {
        ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'Hora de saída obrigatória' });
      }
      if ((data.lunchStart && !data.lunchEnd) || (!data.lunchStart && data.lunchEnd)) {
        ctx.addIssue({
          code: 'custom',
          path: ['lunchEnd'],
          message: 'Para registar almoço, indique início e fim',
        });
      }
      if (data.startTime && data.endTime) {
        if (toMinutes(data.endTime) <= toMinutes(data.startTime)) {
          ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'Hora de saída deve ser após a entrada' });
        }
        if (data.lunchStart && data.lunchEnd) {
          if (toMinutes(data.lunchEnd) <= toMinutes(data.lunchStart)) {
            ctx.addIssue({ code: 'custom', path: ['lunchEnd'], message: 'Fim do almoço deve ser após o início' });
          }
          if (toMinutes(data.lunchStart) <= toMinutes(data.startTime)) {
            ctx.addIssue({ code: 'custom', path: ['lunchStart'], message: 'Almoço deve ser dentro do período de trabalho' });
          }
          if (toMinutes(data.lunchEnd) >= toMinutes(data.endTime)) {
            ctx.addIssue({ code: 'custom', path: ['lunchEnd'], message: 'Almoço deve ser dentro do período de trabalho' });
          }
        }
      }
    }
    if (data.type !== 'NORMAL' && (data.startTime || data.endTime || data.lunchStart || data.lunchEnd)) {
      ctx.addIssue({
        code: 'custom',
        path: ['type'],
        message: 'Horários só podem ser definidos para dia normal de trabalho',
      });
    }
    if (data.type === 'JUSTIFIED_ABSENCE' && !data.justification) {
      ctx.addIssue({ code: 'custom', path: ['justification'], message: 'Justificação é obrigatória para ausência justificada' });
    }
  });

const updateWorkLogBaseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
  type: z.enum(['NORMAL', 'HOLIDAY', 'JUSTIFIED_ABSENCE']).optional(),
  startTime: z.string().regex(timeRegex, 'Formato HH:MM').optional(),
  endTime: z.string().regex(timeRegex, 'Formato HH:MM').optional(),
  lunchStart: z.string().regex(timeRegex, 'Formato HH:MM').optional(),
  lunchEnd: z.string().regex(timeRegex, 'Formato HH:MM').optional(),
  company: z.string().min(1, 'Empresa é obrigatória').optional(),
  taskDescription: z.string().min(1, 'Descrição é obrigatória').optional(),
  justification: z.string().optional(),
});

export const updateWorkLogSchema = updateWorkLogBaseSchema.superRefine((data, ctx) => {
  if (data.type === 'NORMAL') {
    if (!data.startTime) {
      ctx.addIssue({ code: 'custom', path: ['startTime'], message: 'Hora de entrada obrigatória' });
    }
    if (!data.endTime) {
      ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'Hora de saída obrigatória' });
    }
    if ((data.lunchStart && !data.lunchEnd) || (!data.lunchStart && data.lunchEnd)) {
      ctx.addIssue({
        code: 'custom',
        path: ['lunchEnd'],
        message: 'Para registar almoço, indique início e fim',
      });
    }
    if (data.startTime && data.endTime) {
      if (toMinutes(data.endTime) <= toMinutes(data.startTime)) {
        ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'Hora de saída deve ser após a entrada' });
      }
      if (data.lunchStart && data.lunchEnd) {
        if (toMinutes(data.lunchEnd) <= toMinutes(data.lunchStart)) {
          ctx.addIssue({ code: 'custom', path: ['lunchEnd'], message: 'Fim do almoço deve ser após o início' });
        }
        if (toMinutes(data.lunchStart) <= toMinutes(data.startTime)) {
          ctx.addIssue({ code: 'custom', path: ['lunchStart'], message: 'Almoço deve ser dentro do período de trabalho' });
        }
        if (toMinutes(data.lunchEnd) >= toMinutes(data.endTime)) {
          ctx.addIssue({ code: 'custom', path: ['lunchEnd'], message: 'Almoço deve ser dentro do período de trabalho' });
        }
      }
    }
  }
  if (data.type !== 'NORMAL' && (data.startTime || data.endTime || data.lunchStart || data.lunchEnd)) {
    ctx.addIssue({
      code: 'custom',
      path: ['type'],
      message: 'Horários só podem ser definidos para dia normal de trabalho',
    });
  }
  if (data.type === 'JUSTIFIED_ABSENCE' && !data.justification) {
    ctx.addIssue({ code: 'custom', path: ['justification'], message: 'Justificação é obrigatória para ausência justificada' });
  }
});

export type CreateWorkLogInput = z.infer<typeof createWorkLogSchema>;
export type UpdateWorkLogInput = z.infer<typeof updateWorkLogSchema>;
