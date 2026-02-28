import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek } from 'date-fns';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeeklyChart, MonthlyChart } from '@/components/reports/ChartArea';
import { formatHours } from '@/lib/utils';
import type { WeeklySummary, MonthlySummary } from '@/types';

type ViewMode = 'weekly' | 'monthly';

export function ReportsPage() {
  const [mode, setMode] = useState<ViewMode>('weekly');
  const today = new Date();
  const weekDate = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const monthStr = format(today, 'yyyy-MM');

  const { data: weekly, isLoading: weeklyLoading } = useQuery({
    queryKey: ['reports', 'weekly', weekDate],
    queryFn: () => api.get<WeeklySummary>(`/reports/weekly?date=${weekDate}`),
    enabled: mode === 'weekly',
  });

  const { data: monthly, isLoading: monthlyLoading } = useQuery({
    queryKey: ['reports', 'monthly', monthStr],
    queryFn: () => api.get<MonthlySummary>(`/reports/monthly?month=${monthStr}`),
    enabled: mode === 'monthly',
  });

  const isLoading = mode === 'weekly' ? weeklyLoading : monthlyLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Relatórios</h2>
          <p className="text-sm text-muted-foreground">
            Análise semanal e mensal do progresso.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={mode === 'weekly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('weekly')}
          >
            Semanal
          </Button>
          <Button
            variant={mode === 'monthly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('monthly')}
          >
            Mensal
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">A carregar relatório...</div>
      ) : mode === 'weekly' && weekly ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total da Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{formatHours(weekly.totalHours)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Dias Trabalhados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{weekly.daysWorked}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Média Diária</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatHours(weekly.avgHoursPerDay)}</p>
              </CardContent>
            </Card>
          </div>
          <WeeklyChart data={weekly} />
        </div>
      ) : mode === 'monthly' && monthly ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total do Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{formatHours(monthly.totalHours)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Dias Trabalhados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{monthly.daysWorked}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Média Diária</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatHours(monthly.avgHoursPerDay)}</p>
              </CardContent>
            </Card>
          </div>
          <MonthlyChart data={monthly} />
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground">Sem dados disponíveis.</div>
      )}
    </div>
  );
}
