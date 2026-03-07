import { useNavigate } from 'react-router-dom';
import { Loader2, Users } from 'lucide-react';
import { useAggregatedDashboard } from '@/hooks/use-professor';
import { StudentOverviewCard } from '@/components/professor/StudentOverviewCard';

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
        {students.map((student) => (
          <StudentOverviewCard
            key={student.studentId}
            student={student}
            onViewLogs={() => navigate(`/professor/work-logs/${student.studentId}`)}
          />
        ))}
      </div>
    </div>
  );
}
