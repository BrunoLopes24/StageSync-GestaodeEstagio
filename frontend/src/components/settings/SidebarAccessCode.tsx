import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Copy, Check, Loader2, ShieldCheck, KeyRound, X, AlertTriangle, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccessCodeStatus, useGenerateAccessCode, useLinkedProfessor, useRevokeLink } from '@/hooks/use-professor';

export function SidebarAccessCode() {
  const [modalOpen, setModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(false);

  const navigate = useNavigate();
  const { data: codeStatus, isLoading } = useAccessCodeStatus();
  const { data: linkedProfessor } = useLinkedProfessor();
  const generateCode = useGenerateAccessCode();
  const revokeLink = useRevokeLink();

  const hasActiveCode = codeStatus?.hasActiveCode ?? false;
  const hasLinkedProfessor = linkedProfessor?.isActive ?? false;

  async function handleGenerate() {
    try {
      const result = await generateCode.mutateAsync();
      setGeneratedCode(result.code);
      setModalOpen(true);
    } catch {
      // handled by mutation
    }
  }

  async function handleCopy() {
    const codeToCopy = generatedCode ?? codeStatus?.code ?? null;
    if (!codeToCopy) return;
    await navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    setToast(true);
    setTimeout(() => setCopied(false), 2000);
    setTimeout(() => setToast(false), 2500);
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setModalOpen(false);
  }, []);

  useEffect(() => {
    if (modalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [modalOpen, handleKeyDown]);

  if (isLoading) return null;

  const canPortal = typeof document !== 'undefined';

  return (
    <>
      <div className="space-y-2.5">
        <p className="px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Acesso do Orientador
        </p>

        {hasActiveCode && !generatedCode ? (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="group relative flex w-full items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-warning/50 hover:bg-warning/10 hover:shadow-md hover:shadow-warning/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2 focus-visible:ring-offset-card active:translate-y-0"
            title="Gera um código único para o seu orientador aceder ao progresso."
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-warning/15">
              <KeyRound className="h-4 w-4 text-warning" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">Ver Código Ativo</span>
                <span className="rounded-full bg-warning/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-warning">
                  Ativo
                </span>
              </div>
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                Partilhar acesso com o orientador
              </p>
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generateCode.isPending}
            className="group relative flex w-full items-center gap-3 rounded-lg bg-gradient-to-r from-[#4A6CF7] to-[#4CC9C8] px-3 py-2.5 text-left shadow-md shadow-[#4A6CF7]/15 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4A6CF7]/25 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card active:translate-y-0 active:brightness-95 disabled:pointer-events-none disabled:opacity-50"
            title="Gera um código único para o seu orientador aceder ao progresso."
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/15">
              {generateCode.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-white" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-white">
                {generateCode.isPending ? 'A gerar código...' : 'Gerar Código de Acesso'}
              </span>
              <p className="mt-0.5 text-[10px] text-white/70">
                Partilhar acesso com o orientador
              </p>
            </div>
          </button>
        )}
      </div>

      {/* Code Modal */}
      {modalOpen && canPortal && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          style={{ animation: 'fadeIn 200ms ease-out' }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div
            className="relative w-full max-w-sm rounded-xl border border-border/50 bg-card p-6 shadow-2xl"
            style={{ animation: 'scaleIn 200ms ease-out' }}
            role="dialog"
            aria-modal="true"
            aria-label="Código de acesso gerado"
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#4A6CF7] to-[#4CC9C8]">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Código de Acesso</h3>
                <p className="text-xs text-muted-foreground">Partilhe com o seu orientador</p>
              </div>
            </div>

            {generatedCode ? (
              <>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <code className="block select-all text-center font-mono text-lg font-bold tracking-widest text-foreground">
                    {generatedCode.match(/.{1,4}/g)?.join(' ')}
                  </code>
                </div>

                <div className="mt-4">
                  <Button
                    className="w-full"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar Código
                      </>
                    )}
                  </Button>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-start gap-2 rounded-md bg-warning/5 px-3 py-2">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                    <p className="text-[11px] text-warning">
                      Este código pode ser utilizado até à data de expiração.
                    </p>
                  </div>
                  <p className="px-1 text-center text-[11px] text-muted-foreground">
                    Expira em 30 dias
                  </p>
                </div>
              </>
            ) : hasActiveCode ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-center">
                  <p className="text-sm font-medium text-foreground">Código ativo</p>
                  {codeStatus?.code && (
                    <code className="mt-2 block select-all font-mono text-base font-semibold tracking-widest text-foreground">
                      {codeStatus.code.match(/.{1,4}/g)?.join(' ')}
                    </code>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Gerado a {codeStatus?.createdAt
                      ? new Date(codeStatus.createdAt).toLocaleDateString('pt-PT')
                      : '—'}
                  </p>
                  {codeStatus?.expiresAt && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Expira a {new Date(codeStatus.expiresAt).toLocaleDateString('pt-PT')}
                    </p>
                  )}
                </div>
                {codeStatus?.code && (
                  <Button className="w-full" onClick={handleCopy}>
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar Código
                      </>
                    )}
                  </Button>
                )}
              </div>
            ) : null}

            {/* Linked professor section */}
            {hasLinkedProfessor && (
              <div className="mt-4 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-foreground">Professor vinculado</p>
                    <p className="text-[11px] text-muted-foreground">{linkedProfessor!.professorEmail}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => { revokeLink.mutate(); }}
                    disabled={revokeLink.isPending}
                    title="Revogar acesso do professor"
                  >
                    {revokeLink.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Link to full settings */}
            <button
              type="button"
              onClick={() => { setModalOpen(false); navigate('/settings'); }}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <Settings className="h-3 w-3" />
              Gerir nas Definições
            </button>
          </div>
        </div>,
        document.body,
      )}

      {/* Toast */}
      {toast && canPortal && createPortal(
        <div
          className="fixed bottom-6 left-1/2 z-[110] -translate-x-1/2"
          style={{ animation: 'slideUp 300ms ease-out' }}
        >
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 shadow-lg">
            <Check className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-foreground">Código copiado com sucesso.</span>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
