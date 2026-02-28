import { CalendarView } from '@/components/calendar/CalendarView';

export function CalendarPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Calendário</h2>
        <p className="text-sm text-muted-foreground">
          Visão mensal dos dias trabalhados, feriados e fins de semana.
          Clique num dia para adicionar um registo.
        </p>
      </div>

      <CalendarView />

      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-primary/20" />
          <span className="text-muted-foreground">Dia trabalhado</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-destructive/20" />
          <span className="text-muted-foreground">Feriado</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-muted/50" />
          <span className="text-muted-foreground">Fim de semana</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded ring-2 ring-primary" />
          <span className="text-muted-foreground">Hoje</span>
        </div>
      </div>
    </div>
  );
}
