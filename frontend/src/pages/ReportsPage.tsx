import { Button } from '@/components/ui/button';
import { formatHours } from '@/lib/utils';
import { useDashboard } from '@/hooks/use-dashboard';
import { ClipboardList, FileCheck2 } from 'lucide-react';
import { useState } from 'react';

export function ReportsPage() {
  const { data: stats, isLoading, error } = useDashboard();
  const [isDownloadingMidterm, setIsDownloadingMidterm] = useState(false);

  const totalHours = stats?.totalHoursLogged ?? 0;
  const midtermRequired = 320;
  const finalRequired = 640;
  const midtermRemaining = Math.max(0, midtermRequired - totalHours);
  const finalRemaining = Math.max(0, finalRequired - totalHours);
  const midtermUnlocked = midtermRemaining === 0;
  const finalUnlocked = finalRemaining === 0;
  const midtermAvailable = true;

  async function handleDownloadMidtermPdf() {
    try {
      setIsDownloadingMidterm(true);
      const response = await fetch('/api/v1/reports/midterm-pdf');
      if (!response.ok) throw new Error('Falha ao gerar PDF');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'midterm-report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloadingMidterm(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div>
          <h2 className="text-lg font-semibold">Relatórios</h2>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Marcos académicos do estágio com desbloqueio automático por horas concluídas.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">A carregar marcos de relatório...</div>
      ) : error ? (
        <div className="py-8 text-center text-destructive">Não foi possível carregar os relatórios.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <article className="relative flex min-h-[360px] flex-col overflow-hidden rounded-3xl bg-card/85 p-7 shadow-[0_12px_42px_rgba(15,76,117,0.28)]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-secondary/22 via-transparent to-primary/12" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/45 text-primary">
                <ClipboardList className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-secondary/55 px-3 py-1 text-xs font-medium text-secondary-foreground text-right">
                {midtermUnlocked ? 'Desbloqueado' : `${formatHours(midtermRemaining)} em falta`}
              </span>
            </div>

            <div className="relative mt-8 space-y-3">
              <h3 className="text-2xl font-semibold">Midterm Report</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Disponível ao atingir 320 horas de estágio. Inclui atividades desenvolvidas,
                competências adquiridas e principais desafios do percurso até meio do estágio.
              </p>
            </div>

            <div className="relative mt-auto pt-8">
              <Button
                disabled={!midtermAvailable || isDownloadingMidterm}
                onClick={handleDownloadMidtermPdf}
                className="h-11 w-full rounded-xl bg-gradient-to-r from-secondary/70 to-primary/55 text-secondary-foreground shadow-[0_10px_28px_rgba(50,130,184,0.25)] hover:from-secondary/80 hover:to-primary/65"
              >
                {isDownloadingMidterm ? 'Generating...' : midtermAvailable ? 'Available' : 'Locked'}
              </Button>
            </div>
          </article>

          <article className="relative flex min-h-[360px] flex-col overflow-hidden rounded-3xl bg-card/85 p-7 shadow-[0_12px_42px_rgba(15,76,117,0.28)]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-secondary/22 via-transparent to-primary/12" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/45 text-primary">
                <FileCheck2 className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-secondary/55 px-3 py-1 text-xs font-medium text-secondary-foreground">
                {finalUnlocked ? 'Desbloqueado' : `${formatHours(finalRemaining)} em falta`}
              </span>
            </div>

            <div className="relative mt-8 space-y-3">
              <h3 className="text-2xl font-semibold">Final Report</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Disponível ao atingir 640 horas de estágio. Consolida resultados, evolução técnica
                e inclui a componente de avaliação do supervisor.
              </p>
            </div>

            <div className="relative mt-auto pt-8">
              <Button
                disabled={!finalUnlocked}
                className="h-11 w-full rounded-xl bg-gradient-to-r from-secondary/70 to-primary/55 text-secondary-foreground shadow-[0_10px_28px_rgba(50,130,184,0.25)] hover:from-secondary/80 hover:to-primary/65"
              >
                {finalUnlocked ? 'Available' : 'Locked'}
              </Button>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
