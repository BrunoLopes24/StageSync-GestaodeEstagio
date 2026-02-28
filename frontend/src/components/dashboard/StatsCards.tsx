import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Target, Calendar, TrendingUp } from 'lucide-react';
import { formatDate, formatHours } from '@/lib/utils';
import type { DashboardStats } from '@/types';

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Horas Registadas',
      value: formatHours(stats.totalHoursLogged),
      subtitle: `de ${formatHours(stats.totalRequiredHours)}`,
      icon: Clock,
      color: 'text-primary',
    },
    {
      title: 'Horas Restantes',
      value: formatHours(stats.remainingHours),
      subtitle: `${stats.remainingWorkDays} dias úteis`,
      icon: Target,
      color: 'text-warning',
    },
    {
      title: 'Previsão de Conclusão',
      value: stats.predictedEndDate ? formatDate(stats.predictedEndDate) : 'Concluído',
      subtitle: stats.predictedEndDate ? `${stats.remainingWorkDays} dias restantes` : 'Parabéns!',
      icon: Calendar,
      color: 'text-success',
    },
    {
      title: 'Média Diária',
      value: formatHours(stats.avgHoursPerDay),
      subtitle: `${stats.daysWorked} dias trabalhados`,
      icon: TrendingUp,
      color: 'text-primary',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
