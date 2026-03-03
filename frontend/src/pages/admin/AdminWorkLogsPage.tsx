import { useState } from 'react';
import { useAdminWorkLogs, useApproveWorkLog, useRejectWorkLog } from '@/hooks/use-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Check, X } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-warning/10 text-warning',
  APPROVED: 'bg-success/10 text-success',
  REJECTED: 'bg-destructive/10 text-destructive',
};

export function AdminWorkLogsPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { data, isLoading, error } = useAdminWorkLogs({ status: statusFilter });
  const approve = useApproveWorkLog();
  const reject = useRejectWorkLog();

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">A carregar registos...</div>;
  }

  if (error) {
    return (
      <div className="py-8 text-center text-destructive">
        Erro ao carregar registos: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Registos de Trabalho</h1>
        <div className="flex gap-2">
          {[undefined, 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
            <Button
              key={s ?? 'all'}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s ? STATUS_LABELS[s] : 'Todos'}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {data?.total || 0} registo(s) encontrado(s)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4">Data</th>
                  <th className="pb-3 pr-4">Tipo</th>
                  <th className="pb-3 pr-4">Horas</th>
                  <th className="pb-3 pr-4">Empresa</th>
                  <th className="pb-3 pr-4">Estado</th>
                  <th className="pb-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data?.logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/50">
                    <td className="py-3 pr-4">{formatDate(log.date)}</td>
                    <td className="py-3 pr-4">{log.type}</td>
                    <td className="py-3 pr-4">{log.calculatedHours.toFixed(1)}h</td>
                    <td className="py-3 pr-4">{log.company || '-'}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[log.status]}`}
                      >
                        {STATUS_LABELS[log.status]}
                      </span>
                    </td>
                    <td className="py-3">
                      {log.status === 'PENDING' && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => approve.mutate(log.id)}
                            disabled={approve.isPending}
                          >
                            <Check className="h-4 w-4 text-success" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => reject.mutate({ id: log.id })}
                            disabled={reject.isPending}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {(!data?.logs || data.logs.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Nenhum registo encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
