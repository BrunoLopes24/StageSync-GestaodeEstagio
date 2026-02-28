import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WorkLogTable } from '@/components/work-log/WorkLogTable';
import { WorkLogDialog } from '@/components/work-log/WorkLogDialog';
import { Plus } from 'lucide-react';

export function WorkLogPage() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Registos de Horas</h2>
          <p className="text-sm text-muted-foreground">
            Adicione, edite ou elimine os registos diários de trabalho.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Registo
        </Button>
      </div>

      <WorkLogTable page={page} onPageChange={setPage} />

      <WorkLogDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
