import { useState } from 'react';
import { Copy, Check, Loader2, UserX } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  useAccessCodeStatus,
  useGenerateAccessCode,
  useLinkedProfessor,
  useRevokeLink,
} from '@/hooks/use-professor';

export function ProfessorAccessCard() {
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: codeStatus, isLoading: codeLoading } = useAccessCodeStatus();
  const { data: linkedProfessor, isLoading: linkLoading } = useLinkedProfessor();
  const generateCode = useGenerateAccessCode();
  const revokeLink = useRevokeLink();

  async function handleGenerate() {
    try {
      const result = await generateCode.mutateAsync();
      setGeneratedCode(result.code);
    } catch {
      // Error handled by mutation
    }
  }

  async function handleCopy() {
    const codeToCopy = generatedCode ?? codeStatus?.code ?? null;
    if (!codeToCopy) return;
    await navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acesso do Professor Orientador</CardTitle>
        <CardDescription>
          Gere um código de acesso para o seu professor orientador poder acompanhar o seu estágio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {codeLoading || linkLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Code section */}
            {generatedCode ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Código gerado (copie e envie ao professor):</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm">
                    {generatedCode}
                  </code>
                  <Button variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Este código pode ser reutilizado até expirar em 30 dias.
                </p>
              </div>
            ) : codeStatus?.hasActiveCode ? (
              <div className="space-y-2">
                {codeStatus.code && (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm">
                      {codeStatus.code.match(/.{1,4}/g)?.join(' ')}
                    </code>
                    <Button variant="outline" size="icon" onClick={handleCopy}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Já existe um código de acesso ativo (gerado a{' '}
                  {codeStatus.createdAt
                    ? new Date(codeStatus.createdAt).toLocaleDateString('pt-PT')
                    : '—'}
                  ).
                </p>
                {codeStatus.expiresAt && (
                  <p className="text-sm text-muted-foreground">
                    Expira a {new Date(codeStatus.expiresAt).toLocaleDateString('pt-PT')}.
                  </p>
                )}
              </div>
            ) : (
              <Button onClick={handleGenerate} disabled={generateCode.isPending}>
                {generateCode.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gerar Código de Acesso
              </Button>
            )}

            {/* Linked professor section */}
            {linkedProfessor && linkedProfessor.isActive && (
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
