import { useState, type FormEvent } from 'react';
import { Loader2, Mail, UserX } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useGenerateAccessCode,
  useLinkedProfessor,
  useRevokeLink,
} from '@/hooks/use-professor';

export function ProfessorAccessCard() {
  const [professorEmail, setProfessorEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: linkedProfessor, isLoading: linkLoading } = useLinkedProfessor();
  const generateCode = useGenerateAccessCode();
  const revokeLink = useRevokeLink();

  async function handleInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSuccessMessage(null);

    try {
      await generateCode.mutateAsync(professorEmail);
      setSuccessMessage('Convite enviado para o professor.');
      setProfessorEmail('');
    } catch {
      // Error is handled by mutation state
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acesso do Professor Orientador</CardTitle>
        <CardDescription>
          Convide o professor orientador por email. O código de acesso é enviado diretamente ao professor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleInvite} className="space-y-3">
          <div className="space-y-2">
            <label htmlFor="professor-email" className="text-sm font-medium">
              Email do professor
            </label>
            <Input
              id="professor-email"
              type="email"
              placeholder="professor@exemplo.pt"
              value={professorEmail}
              onChange={(e) => setProfessorEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={generateCode.isPending || !professorEmail.trim()}>
            {generateCode.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A enviar convite...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Enviar convite
              </>
            )}
          </Button>
        </form>

        {successMessage && (
          <p className="text-sm text-success">{successMessage}</p>
        )}

        {!linkLoading && linkedProfessor && (
          <div className="rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Professor vinculado</p>
                <p className="text-sm text-muted-foreground">{linkedProfessor.professorEmail}</p>
                <p className="text-xs text-muted-foreground">
                  Desde {new Date(linkedProfessor.linkedAt).toLocaleDateString('pt-PT')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => revokeLink.mutate()}
                disabled={revokeLink.isPending}
                title="Revogar acesso"
              >
                <UserX className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
