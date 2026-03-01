import { useState } from 'react';
import { useDashboard } from '@/hooks/use-dashboard';
import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { CalendarView } from '@/components/calendar/CalendarView';
import { RecentLogs } from '@/components/dashboard/RecentLogs';
import { WorkLogDialog } from '@/components/work-log/WorkLogDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function DashboardPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: stats, isLoading, error } = useDashboard();

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">A carregar dashboard...</div>;
  }

  if (error) {
    return (
      <div className="py-8 text-center text-destructive">
        Erro ao carregar dashboard: {error.message}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Visão geral do seu estágio.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Registo
        </Button>
      </div>

      <StatsCards stats={stats} />

      <div className="rounded-lg border bg-card">
        <div className="flex flex-col lg:flex-row">
          <div className="min-w-0 flex-1">
            <CalendarView embedded />
          </div>
          <div className="flex items-center justify-center p-8 lg:w-64">
            <div className="relative flex items-center justify-center">
              <ProgressRing percent={stats.percentComplete} size={160} strokeWidth={10} />
            </div>
          </div>
        </div>
      </div>

      <RecentLogs />

      <WorkLogDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
