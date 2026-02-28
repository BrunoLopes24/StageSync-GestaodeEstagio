import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { formatDate, formatHours } from '@/lib/utils';
import type { DashboardStats } from '@/types';

interface PredictionCardProps {
  stats: DashboardStats;
}

export function PredictionCard({ stats }: PredictionCardProps) {
  if (stats.remainingHours <= 0) {
    return (
      <Card className="border-success/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-success">
            <TrendingUp className="h-5 w-5" />
            Estágio Concluído!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Completou todas as {formatHours(stats.totalRequiredHours)} necessárias.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Previsão Inteligente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Com a média atual de{' '}
            <span className="font-semibold text-foreground">
              {formatHours(stats.avgHoursPerDay)}/dia
            </span>
            , o estágio será concluído em:
          </p>
          <p className="mt-1 text-2xl font-bold text-primary">
            {stats.predictedEndDate ? formatDate(stats.predictedEndDate) : '—'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Dias úteis restantes</p>
            <p className="font-semibold">{stats.remainingWorkDays}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Horas restantes</p>
            <p className="font-semibold">{formatHours(stats.remainingHours)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
