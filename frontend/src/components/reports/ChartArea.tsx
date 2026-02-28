import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import type { WeeklySummary, MonthlySummary } from '@/types';

interface WeeklyChartProps {
  data: WeeklySummary;
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const chartData = useMemo(
    () =>
      data.dailyBreakdown.map((d) => ({
        date: format(new Date(d.date), 'EEE dd', { locale: pt }),
        hours: d.hours,
      })),
    [data]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Horas por Dia (Semana {data.weekNumber})</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} />
            <YAxis stroke="#a1a1aa" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0a0a0f', border: '1px solid #27272a' }}
              labelStyle={{ color: '#fafafa' }}
            />
            <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface MonthlyChartProps {
  data: MonthlySummary;
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const chartData = useMemo(
    () =>
      data.weeklyBreakdown.map((w) => ({
        week: `Sem ${w.week}`,
        hours: w.hours,
        days: w.days,
      })),
    [data]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Horas por Semana ({data.month})</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="week" stroke="#a1a1aa" fontSize={12} />
            <YAxis stroke="#a1a1aa" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0a0a0f', border: '1px solid #27272a' }}
              labelStyle={{ color: '#fafafa' }}
            />
            <Line type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
