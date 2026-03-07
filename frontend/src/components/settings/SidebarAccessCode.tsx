import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Loader2, Mail, ShieldCheck, X, Trash2, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGenerateAccessCode, useLinkedProfessor, useRevokeLink } from '@/hooks/use-professor';

export function SidebarAccessCode() {
  const [modalOpen, setModalOpen] = useState(false);
  const [professorEmail, setProfessorEmail] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const { data: linkedProfessor } = useLinkedProfessor();
  const generateCode = useGenerateAccessCode();
  const revokeLink = useRevokeLink();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setModalOpen(false);
  }, []);

  useEffect(() => {
    if (modalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [modalOpen, handleKeyDown]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setToastMessage(null);

    try {
      await generateCode.mutateAsync(professorEmail);
      setToastMessage('Convite enviado para o professor.');
      setProfessorEmail('');
      setModalOpen(false);
    } catch {
      // Error is surfaced by mutation state
    }
  }

  const canPortal = typeof document !== 'undefined';

  return (
    <>
      <div className="space-y-2.5">
        <p className="px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Acesso do Orientador
        </p>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="group relative flex w-full items-center gap-3 rounded-lg bg-gradient-to-r from-[#4A6CF7] to-[#4CC9C8] px-3 py-2.5 text-left shadow-md shadow-[#4A6CF7]/15 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4A6CF7]/25 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card active:translate-y-0 active:brightness-95"
          title="Enviar convite por email ao orientador."
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/15">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-white">
              Convidar Professor
            </span>
            <p className="mt-0.5 text-[10px] text-white/70">
              O código é enviado por email
            </p>
          </div>
        </button>
      </div>

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
            aria-label="Convidar professor orientador"
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
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Convidar professor orientador</h3>
                <p className="text-xs text-muted-foreground">O código não é mostrado ao estudante</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2">
                <label htmlFor="sidebar-professor-email" className="text-xs font-medium text-foreground">
                  Email do professor
                </label>
                <Input
                  id="sidebar-professor-email"
                  type="email"
                  placeholder="professor@exemplo.pt"
                  value={professorEmail}
                  onChange={(e) => setProfessorEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={generateCode.isPending || !professorEmail.trim()}>
                {generateCode.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A enviar convite...
                  </>
                ) : (
                  'Enviar convite'
                )}
              </Button>
            </form>

            {linkedProfessor && (
              <div className="mt-4 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-foreground">Professor vinculado</p>
                    <p className="text-[11px] text-muted-foreground">{linkedProfessor.professorEmail}</p>
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

      {toastMessage && canPortal && createPortal(
        <div
          className="fixed bottom-6 left-1/2 z-[110] -translate-x-1/2"
          style={{ animation: 'slideUp 300ms ease-out' }}
        >
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 shadow-lg">
            <Check className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-foreground">{toastMessage}</span>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
