import { useState } from 'react';
import { useAdminStudents } from '@/hooks/use-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

export function AdminStudentsPage() {
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const { data, isLoading, error } = useAdminStudents({ active: activeFilter });

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">A carregar estudantes...</div>;
  }

  if (error) {
    return (
      <div className="py-8 text-center text-destructive">
        Erro ao carregar estudantes: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Estudantes</h1>
        <div className="flex gap-2">
          <Button
            variant={activeFilter === undefined ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(undefined)}
          >
            Todos
          </Button>
          <Button
            variant={activeFilter === true ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(true)}
          >
            Ativos
          </Button>
          <Button
            variant={activeFilter === false ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(false)}
          >
            Inativos
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {data?.total || 0} estudante(s) encontrado(s)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4">N.º</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Estado</th>
                  <th className="pb-3 pr-4">Horas</th>
                  <th className="pb-3 pr-4">Registos</th>
                  <th className="pb-3">Último Login</th>
                </tr>
              </thead>
              <tbody>
                {data?.students.map((student) => (
                  <tr key={student.id} className="border-b border-border/50">
                    <td className="py-3 pr-4 font-medium">{student.studentNumber}</td>
                    <td className="py-3 pr-4">{student.email}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          student.isActive
                            ? 'bg-success/10 text-success'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {student.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{student.totalHours.toFixed(1)}h</td>
                    <td className="py-3 pr-4">{student.logCount}</td>
                    <td className="py-3 text-muted-foreground">
                      {student.lastLoginAt
                        ? formatDate(student.lastLoginAt)
                        : 'Nunca'}
                    </td>
                  </tr>
                ))}
                {(!data?.students || data.students.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Nenhum estudante encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
