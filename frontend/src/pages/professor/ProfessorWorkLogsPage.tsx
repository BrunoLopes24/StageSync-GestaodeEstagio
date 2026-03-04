import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2,
  ArrowLeft,
  Clock,
  Calendar,
  TrendingUp,
  Timer,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  AlertCircle,
} from 'lucide-react';
import { useStudentDashboard, useStudentWorkLogs } from '@/hooks/use-professor';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate, formatHours } from '@/lib/utils';

interface WorkLogEntry {
  id: string;
  date: string;
  type: string;
  startTime: string | null;
  endTime: string | null;
  calculatedHours: number;
  taskDescription: string;
  justification: string | null;
  status: string;
}

const LOG_TYPE_LABELS: Record<string, { label: string; className: string }> = {
  HOLIDAY: {
    label: 'Feriado',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  JUSTIFIED_ABSENCE: {
    label: 'Ausência Justificada',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
};

type FilterPeriod = 'week' | 'month' | 'all';

function getHoursBadgeColor(hours: number): string {
  if (hours >= 7) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (hours >= 4) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
}

function renderTaskDescription(description: string): string[] {
  return description
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

const MAX_VISIBLE_LINES = 4;

function CollapsibleDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = renderTaskDescription(description);

  if (lines.length === 0) return null;

  const shouldCollapse = lines.length > MAX_VISIBLE_LINES;
  const visibleLines = expanded || !shouldCollapse ? lines : lines.slice(0, MAX_VISIBLE_LINES);

  return (
    <div className="mt-3">
      <ul className="space-y-1">
        {visibleLines.map((line, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      {shouldCollapse && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? (
            <>
              Ver menos <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              Ver mais ({lines.length - MAX_VISIBLE_LINES} linhas) <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function ProfessorWorkLogsPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { data: dashboard, isLoading: dashLoading } = useStudentDashboard(studentId!);
  const { data: logsData, isLoading: logsLoading } = useStudentWorkLogs(studentId!);
  const [filter, setFilter] = useState<FilterPeriod>('all');

  const isLoading = dashLoading || logsLoading;

  const allLogs = (logsData?.logs ?? []) as WorkLogEntry[];

  const filteredLogs = useMemo(() => {
    if (filter === 'all') return allLogs;

    const now = new Date();
    const cutoff = filter === 'week' ? getStartOfWeek(now) : getStartOfMonth(now);

    return allLogs.filter((log) => new Date(log.date) >= cutoff);
  }, [allLogs, filter]);

  const studentDisplayName =
    dashboard?.student.name?.trim() ||
    dashboard?.student.studentNumber ||
    dashboard?.student.email ||
    'Aluno';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = dashboard?.stats;
  const percentComplete = stats?.percentComplete ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/professor')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Registos de {studentDisplayName}</h1>
      </div>

      {/* Progress Card */}
      {stats && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
              <TrendingUp className="h-4 w-4" />
              Progresso do Estágio
            </div>

            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex items-end justify-between mb-1.5">
                <span className="text-2xl font-bold">{percentComplete.toFixed(1)}%</span>
                <span className="text-sm text-muted-foreground">
                  {formatHours(stats.totalHoursLogged)} / {formatHours(stats.totalRequiredHours)}
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-3 rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(percentComplete, 100)}%` }}
                />
              </div>
            </div>

            {/* Stats Row */}
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border p-3">
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Restantes
                </p>
                <p className="mt-1 text-lg font-semibold">{formatHours(stats.remainingHours)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Conclusão Prevista
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {stats.predictedEndDate ? formatDate(stats.predictedEndDate) : '—'}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Timer className="h-3 w-3" />
                  Média Diária
                </p>
                <p className="mt-1 text-lg font-semibold">{formatHours(stats.avgHoursPerDay)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  Dias Trabalhados
                </p>
                <p className="mt-1 text-lg font-semibold">{stats.daysWorked}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Buttons */}
      <div className="flex items-center gap-2">
        {(
          [
            { key: 'week', label: 'Esta Semana' },
            { key: 'month', label: 'Este Mês' },
            { key: 'all', label: 'Todos' },
          ] as const
        ).map(({ key, label }) => (
          <Button
            key={key}
            variant={filter === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(key)}
          >
            {label}
          </Button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground">
          {filteredLogs.length} registo{filteredLogs.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Work Logs Timeline */}
      {filteredLogs.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          Nenhum registo de trabalho encontrado.
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div key={log.id} className="relative pl-10">
                {/* Timeline dot */}
                <div className="absolute left-[11px] top-6 h-[9px] w-[9px] rounded-full border-2 border-primary bg-background" />

                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-4">
                        {/* Date */}
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Data
                          </p>
                          <p className="text-sm font-medium">
                            {new Date(log.date).toLocaleDateString('pt-PT', {
                              weekday: 'short',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </p>
                        </div>

                        {/* Time Range */}
                        {log.startTime && log.endTime && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Horário
                            </p>
                            <p className="flex items-center gap-1 text-sm font-medium">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {log.startTime} – {log.endTime}
                            </p>
                          </div>
                        )}

                        {/* Total Hours Badge */}
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Total
                          </p>
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-sm font-bold ${getHoursBadgeColor(log.calculatedHours)}`}
                          >
                            {log.calculatedHours.toFixed(1)}h
                          </span>
                        </div>
                      </div>

                      {/* Type + Status Badges */}
                      <div className="flex items-center gap-2">
                        {LOG_TYPE_LABELS[log.type] && (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${LOG_TYPE_LABELS[log.type].className}`}
                          >
                            {LOG_TYPE_LABELS[log.type].label}
                          </span>
                        )}
                        {log.status !== 'PENDING' && (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              log.status === 'APPROVED'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {log.status === 'APPROVED' ? 'Aprovado' : 'Rejeitado'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Justification for absences */}
                    {log.type === 'JUSTIFIED_ABSENCE' && log.justification && (
                      <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900/40 dark:bg-orange-900/10">
                        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-400">
                          <AlertCircle className="h-3 w-3" />
                          Justificação
                        </p>
                        <p className="mt-1 text-sm text-orange-900 dark:text-orange-300">
                          {log.justification}
                        </p>
                      </div>
                    )}

                    {/* Divider */}
                    {log.taskDescription && (
                      <div className="my-3 border-t border-border" />
                    )}

                    {/* Task Description */}
                    {log.taskDescription && (
                      <CollapsibleDescription description={log.taskDescription} />
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
