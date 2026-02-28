import { useEffect, useMemo } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { WorkLog, WorkLogType } from '@/types';

const timeRegex = /^\d{2}:\d{2}$/;

const optionalTimeSchema = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().regex(timeRegex, 'Formato HH:MM').optional()
);

const optionalTextSchema = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().trim().optional()
);

const schema = z
  .object({
    date: z.string().min(1, 'Data é obrigatória'),
    type: z.enum(['NORMAL', 'HOLIDAY', 'JUSTIFIED_ABSENCE']),
    startTime: optionalTimeSchema,
    endTime: optionalTimeSchema,
    lunchStart: optionalTimeSchema,
    lunchEnd: optionalTimeSchema,
    company: z.string().trim().min(1, 'Empresa é obrigatória'),
    taskDescription: z.string().trim().min(1, 'Descrição da tarefa é obrigatória'),
    justification: optionalTextSchema,
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
        const start = toMinutes(data.startTime);
        const end = toMinutes(data.endTime);

        if (end <= start) {
          ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'Hora de saída deve ser após a entrada' });
        }

        if (data.lunchStart && data.lunchEnd) {
          const lunchStart = toMinutes(data.lunchStart);
          const lunchEnd = toMinutes(data.lunchEnd);

          if (lunchEnd <= lunchStart) {
            ctx.addIssue({ code: 'custom', path: ['lunchEnd'], message: 'Fim do almoço deve ser após o início' });
          }
          if (lunchStart <= start || lunchEnd >= end) {
            ctx.addIssue({
              code: 'custom',
              path: ['lunchStart'],
              message: 'Almoço deve estar dentro do período de trabalho',
            });
          }
          if (lunchEnd - lunchStart >= end - start) {
            ctx.addIssue({
              code: 'custom',
              path: ['lunchEnd'],
              message: 'Duração do almoço inválida para o período de trabalho',
            });
          }
        }
      }
    }

    if (data.type === 'JUSTIFIED_ABSENCE' && !data.justification) {
      ctx.addIssue({
        code: 'custom',
        path: ['justification'],
        message: 'Justificação é obrigatória para ausência justificada',
      });
    }
  });

export type WorkLogFormData = z.infer<typeof schema>;

interface WorkLogFormProps {
  initialValues?: Partial<WorkLog> & { date?: string };
  defaultDate?: string;
  isSubmitting: boolean;
  errorMessage?: string;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (data: WorkLogFormData) => Promise<void>;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function computeCalculatedHours(values: {
  type: WorkLogType;
  startTime?: string;
  endTime?: string;
  lunchStart?: string;
  lunchEnd?: string;
}): number {
  if (values.type !== 'NORMAL' || !values.startTime || !values.endTime) return 0;

  let duration = toMinutes(values.endTime) - toMinutes(values.startTime);
  if (duration <= 0) return 0;

  if (values.lunchStart && values.lunchEnd) {
    duration -= toMinutes(values.lunchEnd) - toMinutes(values.lunchStart);
  }

  return Math.max(0, Math.round((duration / 60) * 100) / 100);
}

export function WorkLogForm({
  initialValues,
  defaultDate,
  isSubmitting,
  errorMessage,
  submitLabel,
  onCancel,
  onSubmit,
}: WorkLogFormProps) {
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkLogFormData>({
    resolver: zodResolver(schema) as Resolver<WorkLogFormData>,
    defaultValues: {
      date: initialValues?.date?.split('T')[0] || defaultDate || new Date().toISOString().split('T')[0],
      type: initialValues?.type || 'NORMAL',
      startTime: initialValues?.startTime || undefined,
      endTime: initialValues?.endTime || undefined,
      lunchStart: initialValues?.lunchStart || undefined,
      lunchEnd: initialValues?.lunchEnd || undefined,
      company: initialValues?.company || '',
      taskDescription: initialValues?.taskDescription || '',
      justification: initialValues?.justification || undefined,
    },
  });

  const type = watch('type');
  const startTime = watch('startTime');
  const endTime = watch('endTime');
  const lunchStart = watch('lunchStart');
  const lunchEnd = watch('lunchEnd');
  const justification = watch('justification');

  useEffect(() => {
    if (type !== 'NORMAL') {
      if (startTime) setValue('startTime', undefined, { shouldDirty: true });
      if (endTime) setValue('endTime', undefined, { shouldDirty: true });
      if (lunchStart) setValue('lunchStart', undefined, { shouldDirty: true });
      if (lunchEnd) setValue('lunchEnd', undefined, { shouldDirty: true });
    }
    if (type !== 'JUSTIFIED_ABSENCE') {
      if (justification) setValue('justification', undefined, { shouldDirty: true });
    }
  }, [type, startTime, endTime, lunchStart, lunchEnd, justification, setValue]);

  const calculatedHours = useMemo(
    () => computeCalculatedHours({ type, startTime, endTime, lunchStart, lunchEnd }),
    [type, startTime, endTime, lunchStart, lunchEnd]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Data</label>
        <Input type="date" {...register('date')} />
        {errors.date && <p className="mt-1 text-xs text-destructive">{errors.date.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Tipo de Registo</label>
        <select
          {...register('type')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="NORMAL">Dia Normal de Trabalho</option>
          <option value="HOLIDAY">Feriado</option>
          <option value="JUSTIFIED_ABSENCE">Ausência Justificada</option>
        </select>
        {errors.type && <p className="mt-1 text-xs text-destructive">{errors.type.message}</p>}
      </div>

      {type === 'NORMAL' && (
        <div className="space-y-4 rounded-md border p-3">
          <p className="text-sm font-medium">Time Tracking</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Start Time</label>
              <Input type="time" {...register('startTime')} />
              {errors.startTime && <p className="mt-1 text-xs text-destructive">{errors.startTime.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm">End Time</label>
              <Input type="time" {...register('endTime')} />
              {errors.endTime && <p className="mt-1 text-xs text-destructive">{errors.endTime.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Lunch Start (opcional)</label>
              <Input type="time" {...register('lunchStart')} />
              {errors.lunchStart && <p className="mt-1 text-xs text-destructive">{errors.lunchStart.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm">Lunch End (opcional)</label>
              <Input type="time" {...register('lunchEnd')} />
              {errors.lunchEnd && <p className="mt-1 text-xs text-destructive">{errors.lunchEnd.message}</p>}
            </div>
          </div>
        </div>
      )}

      {type === 'JUSTIFIED_ABSENCE' && (
        <div>
          <label className="mb-1 block text-sm font-medium">Justificação</label>
          <textarea
            {...register('justification')}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Indique o motivo da ausência..."
          />
          {errors.justification && <p className="mt-1 text-xs text-destructive">{errors.justification.message}</p>}
        </div>
      )}

      <div className="rounded-md border border-dashed p-3 text-sm">
        Calculated Hours: {calculatedHours.toFixed(2)}h
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Empresa</label>
        <Input type="text" {...register('company')} placeholder="Nome da empresa" />
        {errors.company && <p className="mt-1 text-xs text-destructive">{errors.company.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Descrição da Tarefa</label>
        <textarea
          {...register('taskDescription')}
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Descreva o trabalho realizado..."
        />
        {errors.taskDescription && <p className="mt-1 text-xs text-destructive">{errors.taskDescription.message}</p>}
      </div>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'A guardar...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
