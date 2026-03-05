import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/Logo';

const studentSchema = z.object({
  identifier: z.string().min(1, 'Campo obrigatório'),
  password: z.string().min(1, 'Campo obrigatório'),
});

const professorSchema = z.object({
  email: z.string().email('Email inválido'),
  code: z.string().min(8, 'Código deve ter pelo menos 8 caracteres'),
});

type StudentFormData = z.infer<typeof studentSchema>;
type ProfessorFormData = z.infer<typeof professorSchema>;

type LoginTab = 'student' | 'professor';

export function LoginPage() {
  const { login, professorLogin, isAuthenticated, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LoginTab>('student');

  const studentForm = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  });

  const professorForm = useForm<ProfessorFormData>({
    resolver: zodResolver(professorSchema),
  });

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    const target = user?.role === 'PROFESSOR' ? '/professor' : '/dashboard';
    return <Navigate to={target} replace />;
  }

  async function onStudentSubmit(data: StudentFormData) {
    setError(null);
    try {
      const loggedInUser = await login(data.identifier, data.password);
      const target = loggedInUser.role === 'PROFESSOR' ? '/professor' : '/dashboard';
      navigate(target, { replace: true });
    } catch {
      setError('Credenciais inválidas');
    }
  }

  async function onProfessorSubmit(data: ProfessorFormData) {
    setError(null);
    try {
      await professorLogin(data.email, data.code);
      navigate('/professor', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código de acesso inválido');
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="flex w-full max-w-sm flex-col items-center">
        <Logo className="mb-8 h-10" />

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle>Iniciar Sessão</CardTitle>
            <CardDescription>
              {activeTab === 'student'
                ? 'Introduza as suas credenciais institucionais'
                : 'Introduza o email e código de acesso'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex rounded-lg border bg-muted p-1">
              <button
                type="button"
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === 'student'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => { setActiveTab('student'); setError(null); }}
              >
                Estudante
              </button>
              <button
                type="button"
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === 'professor'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => { setActiveTab('professor'); setError(null); }}
              >
                Professor Orientador
              </button>
            </div>

            {activeTab === 'student' ? (
              <form onSubmit={studentForm.handleSubmit(onStudentSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="identifier" className="text-sm font-medium">
                    Identificador
                  </label>
                  <Input
                    id="identifier"
                    placeholder="Número de aluno ou email"
                    autoComplete="username"
                    {...studentForm.register('identifier')}
                  />
                  {studentForm.formState.errors.identifier && (
                    <p className="text-xs text-destructive">{studentForm.formState.errors.identifier.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Palavra-passe
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...studentForm.register('password')}
                  />
                  {studentForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{studentForm.formState.errors.password.message}</p>
                  )}
                </div>

                {error && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={studentForm.formState.isSubmitting}>
                  {studentForm.formState.isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="mr-2 h-4 w-4" />
                  )}
                  Entrar
                </Button>
              </form>
            ) : (
              <form onSubmit={professorForm.handleSubmit(onProfessorSubmit)} className="space-y-4">
                <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
                  O código de acesso é de uso único. Após terminar sessão, terá de pedir um novo código ao estudante.
                </div>

                <div className="space-y-2">
                  <label htmlFor="prof-email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="prof-email"
                    type="email"
                    placeholder="professor@exemplo.pt"
                    autoComplete="email"
                    {...professorForm.register('email')}
                  />
                  {professorForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{professorForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="prof-code" className="text-sm font-medium">
                    Código de Acesso
                  </label>
                  <Input
                    id="prof-code"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    autoComplete="off"
                    {...professorForm.register('code')}
                  />
                  {professorForm.formState.errors.code && (
                    <p className="text-xs text-destructive">{professorForm.formState.errors.code.message}</p>
                  )}
                </div>

                {error && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={professorForm.formState.isSubmitting}>
                  {professorForm.formState.isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="mr-2 h-4 w-4" />
                  )}
                  Entrar como Professor
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à página inicial
        </Link>
      </div>
    </div>
  );
}
