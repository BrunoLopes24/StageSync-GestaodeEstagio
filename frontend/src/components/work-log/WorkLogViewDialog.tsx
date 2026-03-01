import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { WorkLog } from '@/types';

interface WorkLogViewDialogProps {
  open: boolean;
  onClose: () => void;
  log: WorkLog | null;
}

const typeLabels: Record<string, string> = {
  NORMAL: 'Dia Normal de Trabalho',
  HOLIDAY: 'Feriado',
  JUSTIFIED_ABSENCE: 'Ausência Justificada',
};

export function WorkLogViewDialog({ open, onClose, log }: WorkLogViewDialogProps) {
  if (!log) return null;

  const dateFormatted = format(parseISO(log.date), "d 'de' MMMM 'de' yyyy", { locale: pt });

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Detalhes do Registo</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <Field label="Data" value={dateFormatted} />
        <Field label="Tipo" value={typeLabels[log.type] || log.type} />

        {log.type === 'NORMAL' && (
          <>
            <Field
              label="Horário"
              value={`${log.startTime || '—'} – ${log.endTime || '—'}`}
            />
            {(log.lunchStart || log.lunchEnd) && (
              <Field
                label="Almoço"
                value={`${log.lunchStart || '—'} – ${log.lunchEnd || '—'}`}
              />
            )}
            <Field label="Horas" value={`${log.calculatedHours.toFixed(1)}h`} />
          </>
        )}

        {log.type === 'HOLIDAY' && (
          <Field label="Horas" value={`${log.calculatedHours.toFixed(1)}h`} />
        )}

        <Field label="Empresa" value={log.company || '—'} />

        {log.type === 'JUSTIFIED_ABSENCE' && log.justification && (
          <Field label="Justificação" value={log.justification} multiline />
        )}

        {log.taskDescription && (
          <Field label="Descrição da Tarefa" value={log.taskDescription} multiline />
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function Field({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className={cn('mt-1 text-sm', multiline && 'whitespace-pre-wrap')}>{value}</dd>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
