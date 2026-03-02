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

const loginSchema = z.object({
  identifier: z.string().min(1, 'Campo obrigatório'),
  password: z.string().min(1, 'Campo obrigatório'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(data: LoginFormData) {
    setError(null);
    try {
      await login(data.identifier, data.password);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Credenciais inválidas');
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
              Introduza as suas credenciais institucionais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="identifier" className="text-sm font-medium">
                  Identificador
                </label>
                <Input
                  id="identifier"
                  placeholder="Número de aluno ou email"
                  autoComplete="username"
                  {...register('identifier')}
                />
                {errors.identifier && (
                  <p className="text-xs text-destructive">{errors.identifier.message}</p>
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
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              {error && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                Entrar
              </Button>
            </form>
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
