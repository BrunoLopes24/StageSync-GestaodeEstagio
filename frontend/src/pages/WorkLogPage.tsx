import { useRef, useState, type ChangeEvent } from 'react';
import { WorkLogTable } from '@/components/work-log/WorkLogTable';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { exportWorkLogsCsv, importWorkLogsCsv, type ImportCsvResult } from '@/hooks/use-work-logs';
import { useQueryClient } from '@tanstack/react-query';

export function WorkLogPage() {
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<ImportCsvResult['errors']>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Registos de Horas</h2>
          <p className="text-sm text-muted-foreground">
            Edite ou elimine os registos diários de trabalho.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onExport} disabled={isExporting || isImporting}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'A exportar...' : 'Exportar CSV'}
          </Button>
          <Button onClick={onImportClick} disabled={isImporting || isExporting}>
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

      <WorkLogTable page={page} onPageChange={setPage} />
    </div>
  );
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
