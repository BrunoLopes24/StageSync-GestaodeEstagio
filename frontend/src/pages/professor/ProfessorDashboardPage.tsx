import { useNavigate } from 'react-router-dom';
import { Loader2, Users, Clock, TrendingUp } from 'lucide-react';
import { useAggregatedDashboard } from '@/hooks/use-professor';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function nameFromEmail(email: string): string {
  const localPart = email.split('@')[0] ?? '';
  const cleaned = localPart.replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return '';
  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function ProfessorDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useAggregatedDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-destructive">
        Erro ao carregar dashboard: {error.message}
      </div>
    );
  }

  const students = data?.students ?? [];

  if (students.length === 0) {
    return (
      <div className="py-12 text-center">
        <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Sem alunos supervisionados</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Nenhum aluno partilhou um código de acesso consigo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard do Professor</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral dos {students.length} aluno{students.length !== 1 ? 's' : ''} supervisionado{students.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {students.map((student) => {
          const displayName =
            student.name?.trim() ||
            nameFromEmail(student.email) ||
            student.studentNumber ||
            'Aluno';

          return (
          <Card key={student.studentId} className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{displayName}</CardTitle>
              <p className="text-xs text-muted-foreground">{student.email}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Progresso
                </span>
                <span className="font-medium">{student.percentComplete.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(student.percentComplete, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Horas
                </span>
                <span className="font-medium">
                  {student.totalHoursLogged.toFixed(1)}h
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate(`/professor/work-logs/${student.studentId}`)}
              >
                Ver Registos
              </Button>
            </CardContent>
          </Card>
          );
        })}
      </div>
    </div>
  );
}
