import { useAdminSessions, useRevokeSession } from '@/hooks/use-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

export function AdminSessionsPage() {
  const { data: sessions, isLoading, error } = useAdminSessions();
  const revoke = useRevokeSession();

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">A carregar sessões...</div>;
  }

  if (error) {
    return (
      <div className="py-8 text-center text-destructive">
        Erro ao carregar sessões: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sessões Ativas</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {sessions?.length || 0} sessão(ões) ativa(s)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4">Estudante</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">IP</th>
                  <th className="pb-3 pr-4">User Agent</th>
                  <th className="pb-3 pr-4">Expira</th>
                  <th className="pb-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sessions?.map((session) => (
                  <tr key={session.id} className="border-b border-border/50">
                    <td className="py-3 pr-4 font-medium">
                      {session.user.studentIdentity.studentNumber}
                    </td>
                    <td className="py-3 pr-4">
                      {session.user.studentIdentity.institutionalEmail}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {session.ipAddress || '-'}
                    </td>
                    <td className="max-w-48 truncate py-3 pr-4 text-muted-foreground">
                      {session.userAgent || '-'}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {formatDate(session.expiresAt)}
                    </td>
                    <td className="py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revoke.mutate(session.id)}
                        disabled={revoke.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {(!sessions || sessions.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Nenhuma sessão ativa
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
