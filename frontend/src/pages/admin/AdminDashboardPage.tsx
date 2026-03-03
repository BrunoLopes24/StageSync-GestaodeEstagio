import { useAdminDashboard } from '@/hooks/use-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, ClipboardCheck, Monitor } from 'lucide-react';

export function AdminDashboardPage() {
  const { data: stats, isLoading, error } = useAdminDashboard();

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">A carregar painel admin...</div>;
  }

  if (error) {
    return (
      <div className="py-8 text-center text-destructive">
        Erro ao carregar painel: {error.message}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      title: 'Estudantes Ativos',
      value: stats.totalStudents,
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Horas Registadas',
      value: stats.totalHoursLogged.toFixed(1),
      icon: Clock,
      color: 'text-success',
    },
    {
      title: 'Aprovações Pendentes',
      value: stats.pendingApprovals,
      icon: ClipboardCheck,
      color: 'text-warning',
    },
    {
      title: 'Sessões Ativas',
      value: stats.activeSessions,
      icon: Monitor,
      color: 'text-primary',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Painel de Administração</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
