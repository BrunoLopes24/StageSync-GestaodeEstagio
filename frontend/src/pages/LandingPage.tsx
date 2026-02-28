import { Link } from 'react-router-dom';
import { Clock, BarChart3, Calendar, Target, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Clock,
    title: 'Registo de Horas',
    description: 'Registe as horas trabalhadas diariamente com notas e acompanhe o progresso em tempo real.',
  },
  {
    icon: Target,
    title: 'Previsão Inteligente',
    description: 'Cálculo automático da data de conclusão baseado no seu ritmo, excluindo fins de semana e feriados portugueses.',
  },
  {
    icon: Calendar,
    title: 'Vista Calendário',
    description: 'Visualize os dias trabalhados, feriados e fins de semana num calendário mensal interativo.',
  },
  {
    icon: BarChart3,
    title: 'Relatórios Detalhados',
    description: 'Resumos semanais e mensais com gráficos para analisar a sua produtividade.',
  },
];

const highlights = [
  'Cálculo automático de 640 horas de estágio',
  'Feriados nacionais portugueses incluídos',
  'Previsão dinâmica de conclusão',
  'Dashboard com estatísticas em tempo real',
  'Pronto para integração com autenticação',
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">StageSync</span>
          </div>
          <Link to="/dashboard">
            <Button>
              Aceder ao Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Gestão de Estágio
            <span className="block text-primary">Simplificada</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Acompanhe as suas 640 horas de estágio com previsão inteligente de conclusão,
            calendário interativo e relatórios detalhados. Tudo automatizado.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/dashboard">
              <Button size="lg">
                Começar Agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-card/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold">Funcionalidades</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-lg border bg-card p-6">
                <feature.icon className="mb-4 h-8 w-8 text-primary" />
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-center text-3xl font-bold">
            Tudo num só lugar
          </h2>
          <p className="mb-12 text-center text-muted-foreground">
            O dashboard oferece uma visão completa do progresso do seu estágio.
          </p>
          <div className="mx-auto max-w-2xl rounded-lg border bg-card p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Progresso</p>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full w-1/3 rounded-full bg-primary" />
                </div>
                <p className="mt-1 text-right text-sm font-medium text-primary">33.5%</p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Previsão</p>
                <p className="mt-2 text-2xl font-bold">15/07/2026</p>
                <p className="text-xs text-muted-foreground">62 dias úteis restantes</p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Horas Registadas</p>
                <p className="mt-2 text-2xl font-bold text-primary">214.5h</p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Média Diária</p>
                <p className="mt-2 text-2xl font-bold">7.2h</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="border-t bg-card/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold">Porquê o StageSync?</h2>
          <div className="mx-auto max-w-lg space-y-4">
            {highlights.map((h) => (
              <div key={h} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-success" />
                <p>{h}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-3xl font-bold">Pronto para começar?</h2>
          <p className="mt-4 text-muted-foreground">
            Comece a registar as suas horas de estágio agora mesmo.
          </p>
          <Link to="/dashboard" className="mt-8 inline-block">
            <Button size="lg">
              Aceder ao Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted-foreground">
          <p>StageSync - Gestão de Estágio &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
