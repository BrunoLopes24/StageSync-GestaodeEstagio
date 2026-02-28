import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateWorkLog, useUpdateWorkLog, type WorkLogInput } from '@/hooks/use-work-logs';
import { useSettings } from '@/hooks/use-settings';
import type { WorkLog } from '@/types';
import { WorkLogForm, type WorkLogFormData } from './WorkLogForm';

interface WorkLogDialogProps {
  open: boolean;
  onClose: () => void;
  editLog?: WorkLog | null;
  defaultDate?: string;
}

export function WorkLogDialog({ open, onClose, editLog, defaultDate }: WorkLogDialogProps) {
  const createMutation = useCreateWorkLog();
  const updateMutation = useUpdateWorkLog();
  const { data: settings } = useSettings();
  const isEditing = !!editLog;

  const isPending = createMutation.isPending || updateMutation.isPending;

  const buildPayload = (data: WorkLogFormData): WorkLogInput => {
    const payload: WorkLogInput = {
      date: data.date,
      type: data.type,
    };
    if (data.taskDescription) payload.taskDescription = data.taskDescription;

    if (data.type === 'NORMAL') {
      payload.startTime = data.startTime;
      payload.endTime = data.endTime;
      if (data.lunchStart) payload.lunchStart = data.lunchStart;
      if (data.lunchEnd) payload.lunchEnd = data.lunchEnd;
    }

    if (data.type === 'JUSTIFIED_ABSENCE' && data.justification) {
      payload.justification = data.justification;
    }

    return payload;
  };

  const handleSubmit = async (data: WorkLogFormData) => {
    const payload = buildPayload(data);

    if (isEditing && editLog) {
      await updateMutation.mutateAsync({ id: editLog.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }

    onClose();
  };

  const errorMessage = (createMutation.error || updateMutation.error)?.message;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Editar Registo' : 'Novo Registo'}</DialogTitle>
      </DialogHeader>

      <WorkLogForm
        initialValues={editLog || undefined}
        defaultDate={defaultDate}
        organizationName={settings?.organizationName}
        isSubmitting={isPending}
        errorMessage={errorMessage}
        submitLabel={isEditing ? 'Atualizar' : 'Criar'}
        onCancel={onClose}
        onSubmit={handleSubmit}
      />
    </Dialog>
  );
}
