import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWorkLogs, useDeleteWorkLog } from '@/hooks/use-work-logs';
import { formatDate, formatHours } from '@/lib/utils';
import { Pencil, Trash2 } from 'lucide-react';
import { WorkLogDialog } from './WorkLogDialog';
import type { WorkLog } from '@/types';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface WorkLogTableProps {
  page: number;
  onPageChange: (page: number) => void;
}

export function WorkLogTable({ page, onPageChange }: WorkLogTableProps) {
  const { data, isLoading } = useWorkLogs({ page, limit: 15 });
  const deleteMutation = useDeleteWorkLog();
  const [editLog, setEditLog] = useState<WorkLog | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">A carregar...</div>;
  }

  if (!data?.data.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Sem registos. Clique em &quot;Novo Registo&quot; para começar.
      </div>
    );
  }

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">Data</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Horas</th>
              <th className="hidden px-4 py-3 text-left text-sm font-medium md:table-cell">Notas</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((log) => (
              <tr key={log.id} className="border-b last:border-0">
                <td className="px-4 py-3 text-sm">{formatDate(log.date)}</td>
                <td className="px-4 py-3 text-sm font-medium text-primary">
                  {formatHours(log.hours)}
                </td>
                <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
                  {log.notes || '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditLog(log)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(log.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {data.page} de {data.totalPages} ({data.total} registos)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Seguinte
            </Button>
          </div>
        </div>
      )}

      <WorkLogDialog
        open={!!editLog}
        onClose={() => setEditLog(null)}
        editLog={editLog}
      />

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogHeader>
          <DialogTitle>Confirmar Eliminação</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Tem a certeza que pretende eliminar este registo? Esta ação não pode ser revertida.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteId(null)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'A eliminar...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
