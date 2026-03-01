import { Link } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  Clock,
  Target,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';

const features = [
  {
    icon: Clock,
    title: 'Registo de Horas',
    description: 'Registe horas diariamente com notas e acompanhe o progresso.',
  },
  {
    icon: Target,
    title: 'Previsão Inteligente',
    description: 'Cálculo automático da data de conclusão baseado no seu ritmo.',
  },
  {
    icon: Calendar,
    title: 'Vista Calendário',
    description: 'Visualize dias trabalhados, feriados e fins de semana.',
  },
  {
    icon: BarChart3,
    title: 'Relatórios Detalhados',
    description: 'Resumos semanais e mensais com gráficos de produtividade.',
  },
];

const highlights = [
  'Cálculo automático de 640 horas de estágio',
  'Feriados nacionais portugueses incluídos',
  'Previsão dinâmica de conclusão',
  'Dashboard com estatísticas em tempo real',
  'Pronto para integração com autenticação',
];

const mockLogs = [
  { date: '28 Fev', task: 'Implementação de API REST', hours: 7.5 },
  { date: '27 Fev', task: 'Revisão de código e testes', hours: 8.0 },
  { date: '26 Fev', task: 'Design de base de dados', hours: 7.0 },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo className="h-8 sm:h-9" />
          <Link to="/dashboard">
            <Button>
              Aceder ao Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-12">
        {/* Hero — split layout */}
        <section className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Gestão de Estágio
              <span className="block text-primary">Simplificada</span>
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              Acompanhe as suas 640 horas de estágio com previsão inteligente,
              calendário interativo e relatórios detalhados.
            </p>
            <Link to="/dashboard" className="mt-6 inline-block">
              <Button size="lg">
                Começar Agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Dashboard preview mockup */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border p-4">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Progresso</p>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full w-1/3 rounded-full bg-primary" />
                </div>
                <p className="mt-1.5 text-right text-sm font-bold text-primary">33.5%</p>
              </div>
              <div className="rounded-md border p-4">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Previsão</p>
                  <Calendar className="h-4 w-4 text-success" />
                </div>
                <p className="text-2xl font-bold">15/07/2026</p>
                <p className="text-xs text-muted-foreground">62 dias úteis restantes</p>
              </div>
              <div className="rounded-md border p-4">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Horas Registadas</p>
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-bold text-primary">214.5h</p>
                <p className="text-xs text-muted-foreground">de 640h</p>
              </div>
              <div className="rounded-md border p-4">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-sm font-medium text-muted-foreground">Média Diária</p>
                  <Target className="h-4 w-4 text-warning" />
                </div>
                <p className="text-2xl font-bold">7.2h</p>
                <p className="text-xs text-muted-foreground">últimos 30 dias</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features — dashboard-style module cards */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Funcionalidades</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border bg-card p-6 shadow-sm"
              >
                <div className="mb-3 inline-flex rounded-md bg-secondary/50 p-2">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1 text-sm font-medium">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Unified Preview — realistic dashboard snapshot */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Vista do Dashboard</h2>
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="border-b p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Registos Recentes</p>
                </div>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-3 p-6">
              {mockLogs.map((log) => (
                <div
                  key={log.date}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-muted-foreground">{log.date}</span>
                    <span className="text-sm">{log.task}</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{log.hours}h</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust — compact system-style checklist */}
        <section className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="mb-4 text-sm font-medium text-muted-foreground">Porquê o StageSync?</p>
          <div className="space-y-2">
            {highlights.map((h) => (
              <div key={h} className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 shrink-0 text-success" />
                <p className="text-sm">{h}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA — minimal */}
        <section className="py-4 text-center">
          <p className="mb-4 text-muted-foreground">
            Comece a registar as suas horas de estágio agora mesmo.
          </p>
          <Link to="/dashboard">
            <Button size="lg">
              Aceder ao Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="mx-auto max-w-6xl px-6 text-center text-xs text-muted-foreground">
          <p>StageSync - Gestão de Estágio &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
