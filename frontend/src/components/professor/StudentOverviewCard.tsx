import {
  Clock,
  TrendingUp,
  Calendar,
  Activity,
  Timer,
  BarChart3,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate, formatHours } from '@/lib/utils';
import type { AggregatedDashboardStudent } from '@/types/professor';

interface StudentOverviewCardProps {
  student: AggregatedDashboardStudent;
  onViewLogs: () => void;
}

function nameFromEmail(email: string): string {
  const localPart = email.split('@')[0] ?? '';
  const cleaned = localPart.replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return '';
  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const STATUS_MAP: Record<
  AggregatedDashboardStudent['internshipStatus'],
  { label: string; colorClass: string; dotClass: string }
> = {
  ON_TRACK: { label: 'No caminho certo', colorClass: 'text-success', dotClass: 'bg-green-500' },
  SLIGHTLY_BEHIND: { label: 'Em risco', colorClass: 'text-destructive', dotClass: 'bg-red-500' },
  AT_RISK: { label: 'Em risco', colorClass: 'text-destructive', dotClass: 'bg-red-500' },
  COMPLETED: { label: 'Concluído', colorClass: 'text-success', dotClass: 'bg-green-500' },
  NO_DATA: { label: 'Sem dados', colorClass: 'text-muted-foreground', dotClass: 'bg-gray-400' },
};

function truncate(text: string, maxLen = 60): string {
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

export function StudentOverviewCard({ student, onViewLogs }: StudentOverviewCardProps) {

  const displayName =
    student.name?.trim() ||
    nameFromEmail(student.email) ||
    student.studentNumber ||
    'Aluno';

  const status = STATUS_MAP[student.internshipStatus] ?? STATUS_MAP.NO_DATA;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="min-w-0">
          <CardTitle className="text-base">{displayName}</CardTitle>
          <p className="text-xs text-muted-foreground">{student.email}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              Progresso
            </span>
            <span className="font-medium">{student.percentComplete.toFixed(1)}%</span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(student.percentComplete, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatHours(student.totalHoursLogged)} / {formatHours(student.totalRequiredHours ?? 0)}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Restantes
            </p>
            <p className="font-medium">{formatHours(student.remainingHours ?? 0)}</p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Previsão
            </p>
            <p className="font-medium">
              {student.predictedEndDate ? formatDate(student.predictedEndDate) : '—'}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              Última Atividade
            </p>
            <p className="font-medium">
              {student.lastActivityDate ? formatDate(student.lastActivityDate) : 'Sem atividade'}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Timer className="h-3 w-3" />
              Esta Semana
            </p>
            <p className="font-medium">
              {student.weeklyLogCount ?? 0} registo{(student.weeklyLogCount ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Average weekly hours */}
        <div className="flex items-center justify-between rounded-md border p-2 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5" />
            Média semanal
          </span>
          <span className="font-medium">{formatHours(student.averageWeeklyHours ?? 0)}</span>
        </div>

        {/* Recent activity */}
        {(student.recentLogs?.length ?? 0) > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Atividade Recente
            </p>
            <div className="space-y-1.5">
              {student.recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-md border p-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">{formatDate(log.date)}</span>
                    <span className="ml-2 text-muted-foreground">
                      {truncate(log.taskDescription)}
                    </span>
                  </div>
                  <span className="ml-2 shrink-0 font-semibold text-primary">
                    {formatHours(log.calculatedHours)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View logs button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onViewLogs}
        >
          Ver Registos
        </Button>
      </CardContent>
    </Card>
  );
}
