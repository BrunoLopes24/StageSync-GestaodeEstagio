import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Clock, Calendar } from 'lucide-react';
import { useStudentDashboard, useStudentWorkLogs } from '@/hooks/use-professor';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WorkLogEntry {
  id: string;
  date: string;
  type: string;
  startTime: string | null;
  endTime: string | null;
  calculatedHours: number;
  taskDescription: string;
  status: string;
}

export function ProfessorWorkLogsPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { data: dashboard, isLoading: dashLoading } = useStudentDashboard(studentId!);
  const { data: logsData, isLoading: logsLoading } = useStudentWorkLogs(studentId!);

  const isLoading = dashLoading || logsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const logs = (logsData?.logs ?? []) as WorkLogEntry[];
  const studentDisplayName =
    dashboard?.student.name?.trim() ||
    dashboard?.student.studentNumber ||
    dashboard?.student.email ||
    'Aluno';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/professor')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            Registos de {studentDisplayName}
          </h1>
          {dashboard && (
            <p className="text-sm text-muted-foreground">
              {dashboard.stats.totalHoursLogged.toFixed(1)}h de {dashboard.stats.totalRequiredHours}h ({dashboard.stats.percentComplete.toFixed(1)}%)
            </p>
          )}
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          Nenhum registo de trabalho encontrado.
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(log.date).toLocaleDateString('pt-PT')}
                  </CardTitle>
                  {log.status !== 'PENDING' && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      log.status === 'APPROVED'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {log.status === 'APPROVED' ? 'Aprovado' : 'Rejeitado'}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {log.startTime && log.endTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {log.startTime} - {log.endTime}
                    </span>
                  )}
                  <span>{log.calculatedHours.toFixed(1)}h</span>
                </div>
                {log.taskDescription && (
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{log.taskDescription}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
