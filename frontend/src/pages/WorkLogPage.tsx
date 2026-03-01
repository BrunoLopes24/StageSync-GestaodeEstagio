import { useRef, useState, type ChangeEvent } from 'react';
import { WorkLogTable } from '@/components/work-log/WorkLogTable';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { exportWorkLogsCsv, importWorkLogsCsv } from '@/hooks/use-work-logs';
import { useQueryClient } from '@tanstack/react-query';

export function WorkLogPage() {
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
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
      const content = await file.text();
      const result = await importWorkLogsCsv(content);
      await queryClient.invalidateQueries({ queryKey: ['work-logs'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['reports'] });
      setFeedback(`Importação concluída: ${result.created} criados, ${result.updated} atualizados.`);
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

      <WorkLogTable page={page} onPageChange={setPage} />
    </div>
  );
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
