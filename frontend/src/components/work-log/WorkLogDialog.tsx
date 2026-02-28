import { useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateWorkLog, useUpdateWorkLog } from '@/hooks/use-work-logs';
import type { WorkLog } from '@/types';

const schema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  hours: z.coerce.number().min(0.5, 'Mínimo 0.5h').max(24, 'Máximo 24h'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface WorkLogDialogProps {
  open: boolean;
  onClose: () => void;
  editLog?: WorkLog | null;
  defaultDate?: string;
}

export function WorkLogDialog({ open, onClose, editLog, defaultDate }: WorkLogDialogProps) {
  const createMutation = useCreateWorkLog();
  const updateMutation = useUpdateWorkLog();
  const isEditing = !!editLog;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      date: editLog?.date?.split('T')[0] || defaultDate || new Date().toISOString().split('T')[0],
      hours: editLog?.hours || 7,
      notes: editLog?.notes || '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        date: editLog?.date?.split('T')[0] || defaultDate || new Date().toISOString().split('T')[0],
        hours: editLog?.hours || 7,
        notes: editLog?.notes || '',
      });
    }
  }, [open, editLog, defaultDate, reset]);

  const onSubmit = async (data: FormData) => {
    if (isEditing && editLog) {
      await updateMutation.mutateAsync({ id: editLog.id, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }
    onClose();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Editar Registo' : 'Novo Registo'}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Data</label>
          <Input type="date" {...register('date')} />
          {errors.date && <p className="mt-1 text-xs text-destructive">{errors.date.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Horas</label>
          <Input type="number" step="0.5" min="0.5" max="24" {...register('hours')} />
          {errors.hours && <p className="mt-1 text-xs text-destructive">{errors.hours.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Notas (opcional)</label>
          <textarea
            {...register('notes')}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="O que fez hoje..."
          />
        </div>

        {(createMutation.error || updateMutation.error) && (
          <p className="text-sm text-destructive">
            {(createMutation.error || updateMutation.error)?.message}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'A guardar...' : isEditing ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
