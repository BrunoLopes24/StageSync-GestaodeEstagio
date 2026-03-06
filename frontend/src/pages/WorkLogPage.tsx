import { useRef, useState, type ChangeEvent } from 'react';
import { WorkLogTable } from '@/components/work-log/WorkLogTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Upload, FileText, Clock, Calendar, X } from 'lucide-react';
import { useWorkLogs, exportWorkLogsCsv, importWorkLogsCsv, type ImportCsvResult } from '@/hooks/use-work-logs';
import { useDashboard } from '@/hooks/use-dashboard';
import { useQueryClient } from '@tanstack/react-query';
import { formatHours } from '@/lib/utils';
import type { WorkLogType } from '@/types';

export function WorkLogPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [typeFilter, setTypeFilter] = useState<WorkLogType | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<ImportCsvResult['errors']>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useWorkLogs({
    page,
    limit,
    from: dateFrom || undefined,
    to: dateTo || undefined,
  });

  const { data: dashboardStats } = useDashboard();

  const hasFilters = typeFilter !== 'ALL' || dateFrom !== '' || dateTo !== '';

  const clearFilters = () => {
    setTypeFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const onExport = async () => {
    try {
      setIsExporting(true);
      setFeedback(null);
      await exportWorkLogsCsv();
      setFeedback('Exportação CSV concluída.');
    } catch (err: unknown) {
      setFeedback(getErrorMessage(err, 'Erro ao exportar CSV.'));
    } finally {
      setIsExporting(false);
    }
  };

  const onImportClick = () => {
    fileInputRef.current?.click();
  };

  const onImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setFeedback(null);
      setImportErrors([]);
      const content = await file.text();
      const result = await importWorkLogsCsv(content);
      await queryClient.invalidateQueries({ queryKey: ['work-logs'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['reports'] });
      const parts = [`${result.created} criados`, `${result.updated} atualizados`];
      if (result.skipped > 0) parts.push(`${result.skipped} ignorados`);
      setFeedback(`Importação concluída: ${parts.join(', ')}.`);
      if (result.errors?.length) setImportErrors(result.errors);
      setPage(1);
    } catch (err: unknown) {
      setFeedback(getErrorMessage(err, 'Erro ao importar CSV.'));
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header + CSV buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Registos de Horas</h2>
          <p className="text-sm text-muted-foreground">
            Edite ou elimine os registos diários de trabalho.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onExport}
            disabled={isExporting || isImporting}
            title="Exportar todos os registos para ficheiro CSV"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'A exportar...' : 'Exportar CSV'}
          </Button>
          <Button
            onClick={onImportClick}
            disabled={isImporting || isExporting}
            title="Importar registos a partir de ficheiro CSV"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isImporting ? 'A importar...' : 'Importar CSV'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={onImportFile}
          />
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total Registos</p>
              <p className="text-lg font-bold">{data?.total ?? '--'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Horas Totais</p>
              <p className="text-lg font-bold">
                {dashboardStats ? formatHours(dashboardStats.totalHoursLogged) : '--'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Dias Trabalhados</p>
              <p className="text-lg font-bold">{dashboardStats?.daysWorked ?? '--'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-md border bg-card/50 p-3 sm:flex-row sm:items-end">
        <div className="flex-1 min-w-0">
          <label className="mb-1 block text-xs text-muted-foreground">Tipo</label>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as WorkLogType | 'ALL'); setPage(1); }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="ALL">Todos os tipos</option>
            <option value="NORMAL">Dia Normal de Trabalho</option>
            <option value="HOLIDAY">Feriado</option>
            <option value="JUSTIFIED_ABSENCE">Ausência Justificada</option>
          </select>
        </div>
        <div className="flex flex-1 gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted-foreground">De</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted-foreground">Até</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Por página</label>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
              <X className="mr-1 h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Feedback */}
      {feedback && <p className="text-sm text-muted-foreground">{feedback}</p>}
      {importErrors.length > 0 && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <p className="mb-1 text-sm font-medium text-destructive">Erros na importação:</p>
          <ul className="space-y-0.5 text-xs text-destructive">
            {importErrors.map((e, i) => (
              <li key={i}>Linha {e.row}: {e.error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Table */}
      <WorkLogTable
        data={data}
        isLoading={isLoading}
        page={page}
        onPageChange={setPage}
        typeFilter={typeFilter}
        limit={limit}
      />
    </div>
  );
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
