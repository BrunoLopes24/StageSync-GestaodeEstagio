import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useDeleteWorkLog } from '@/hooks/use-work-logs';
import { formatDate, formatHours } from '@/lib/utils';
import { Pencil, Trash2, FileText } from 'lucide-react';
import { WorkLogDialog } from './WorkLogDialog';
import type { WorkLog, WorkLogListResponse, WorkLogType } from '@/types';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface WorkLogTableProps {
  data: WorkLogListResponse | undefined;
  isLoading: boolean;
  page: number;
  onPageChange: (page: number) => void;
  typeFilter?: WorkLogType | 'ALL';
  limit?: number;
}

const TYPE_BADGE_CONFIG: Record<WorkLog['type'], { label: string; classes: string; borderColor: string }> = {
  NORMAL: {
    label: 'Normal',
    classes: 'bg-primary/15 text-primary border-primary/30',
    borderColor: 'var(--color-primary)',
  },
  HOLIDAY: {
    label: 'Feriado',
    classes: 'bg-warning/15 text-warning border-warning/30',
    borderColor: 'var(--color-warning)',
  },
  JUSTIFIED_ABSENCE: {
    label: 'Ausência Just.',
    classes: 'bg-muted text-muted-foreground border-border',
    borderColor: 'var(--color-muted-foreground)',
  },
};

function TypeBadge({ type }: { type: WorkLog['type'] }) {
  const { label, classes } = TYPE_BADGE_CONFIG[type];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}

export function WorkLogTable({ data, isLoading, page, onPageChange, typeFilter = 'ALL', limit = 15 }: WorkLogTableProps) {
  const deleteMutation = useDeleteWorkLog();
  const [editLog, setEditLog] = useState<WorkLog | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  const items = data?.data;
  const filteredData = useMemo(() => {
    if (!items) return [];
    if (typeFilter === 'ALL') return items;
    return items.filter((log) => log.type === typeFilter);
  }, [items, typeFilter]);

  const handleDelete = useCallback(async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  }, [deleteId, deleteMutation]);

  const toggleDescription = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDescriptions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">A carregar...</div>;
  }

  if (!data?.data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-muted/50 p-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-1 text-sm font-medium">Sem registos de horas</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Ainda não existem registos. Utilize o botão &quot;Novo Registo&quot; para começar a registar as suas horas de trabalho.
        </p>
      </div>
    );
  }

  if (filteredData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Nenhum registo encontrado para os filtros selecionados.</p>
      </div>
    );
  }

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, data.total);

  return (
    <>
      {/* Mobile card view */}
      <div className="space-y-3 md:hidden">
        {filteredData.map((log) => (
          <div
            key={log.id}
            className="cursor-pointer rounded-md border border-l-4 p-3 transition-colors hover:bg-muted/20"
            style={{ borderLeftColor: TYPE_BADGE_CONFIG[log.type].borderColor }}
            onClick={() => setEditLog(log)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{formatDate(log.date)}</p>
                <div className="mt-1">
                  <TypeBadge type={log.type} />
                </div>
              </div>
              <p className="shrink-0 font-semibold text-primary">
                {formatHours(log.calculatedHours)}
              </p>
            </div>

            {log.taskDescription && (
              <div className="mt-2">
                <p className={`text-sm text-muted-foreground ${expandedDescriptions.has(log.id) ? 'whitespace-pre-line' : 'line-clamp-2'}`}>
                  {log.taskDescription}
                </p>
                {log.taskDescription.length > 80 && (
                  <button
                    className="mt-0.5 text-xs text-primary hover:underline"
                    onClick={(e) => toggleDescription(log.id, e)}
                  >
                    {expandedDescriptions.has(log.id) ? 'Ver menos' : 'Ver mais'}
                  </button>
                )}
              </div>
            )}

            {log.company && (
              <p className="mt-2 text-xs text-muted-foreground">
                Empresa: {log.company}
              </p>
            )}

            <div className="mt-2 flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Editar registo"
                onClick={(e) => { e.stopPropagation(); setEditLog(log); }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Eliminar registo"
                onClick={(e) => { e.stopPropagation(); setDeleteId(log.id); }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden overflow-x-auto rounded-md border md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">Data</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Tipo</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Horas</th>
              <th className="hidden px-4 py-3 text-left text-sm font-medium md:table-cell">Empresa</th>
              <th className="hidden px-4 py-3 text-left text-sm font-medium lg:table-cell">Descrição</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((log) => (
              <tr
                key={log.id}
                className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/30"
                onClick={() => setEditLog(log)}
              >
                <td className="px-4 py-3.5 text-sm">{formatDate(log.date)}</td>
                <td className="px-4 py-3.5 text-sm">
                  <TypeBadge type={log.type} />
                </td>
                <td className="px-4 py-3.5 text-sm">
                  <span className="font-semibold text-primary">
                    {formatHours(log.calculatedHours)}
                  </span>
                </td>
                <td className="hidden px-4 py-3.5 text-sm text-muted-foreground md:table-cell">
                  {log.company}
                </td>
                <td className="hidden max-w-xs px-4 py-3.5 text-sm text-muted-foreground lg:table-cell">
                  {log.taskDescription && (
                    <div>
                      <p className={expandedDescriptions.has(log.id) ? 'whitespace-pre-line' : 'line-clamp-2'}>
                        {log.taskDescription}
                      </p>
                      {log.taskDescription.length > 80 && (
                        <button
                          className="mt-0.5 text-xs text-primary hover:underline"
                          onClick={(e) => toggleDescription(log.id, e)}
                        >
                          {expandedDescriptions.has(log.id) ? 'Ver menos' : 'Ver mais'}
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Editar registo"
                      onClick={(e) => { e.stopPropagation(); setEditLog(log); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Eliminar registo"
                      onClick={(e) => { e.stopPropagation(); setDeleteId(log.id); }}
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

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            A mostrar {startItem}–{endItem} de {data.total} registos
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(1)}
            >
              Primeira
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Anterior
            </Button>
            <span className="flex items-center px-2 text-sm text-muted-foreground">
              {page} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Seguinte
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => onPageChange(data.totalPages)}
            >
              Última
            </Button>
          </div>
        </div>
      )}

      {/* Edit dialog */}
      <WorkLogDialog
        open={!!editLog}
        onClose={() => setEditLog(null)}
        editLog={editLog}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogHeader>
          <DialogTitle>Eliminar registo?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Esta ação não pode ser revertida. Tem a certeza que pretende eliminar este registo?
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
