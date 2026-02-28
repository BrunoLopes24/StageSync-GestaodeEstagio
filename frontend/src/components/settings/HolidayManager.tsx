import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHolidays, useGenerateHolidays, useDeleteHoliday } from '@/hooks/use-holidays';
import { formatDate } from '@/lib/utils';
import { CalendarDays, RefreshCw, Trash2 } from 'lucide-react';

export function HolidayManager() {
  const year = new Date().getFullYear();
  const { data: holidays, isLoading } = useHolidays(year);
  const generateMutation = useGenerateHolidays();
  const deleteMutation = useDeleteHoliday();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Feriados Portugueses ({year})
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => generateMutation.mutate(year)}
          disabled={generateMutation.isPending}
        >
          <RefreshCw className="mr-2 h-3 w-3" />
          Gerar
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">A carregar...</p>
        ) : !holidays?.length ? (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Nenhum feriado encontrado.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => generateMutation.mutate(year)}
            >
              Gerar Feriados para {year}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {holidays.map((holiday) => (
              <div
                key={holiday.id}
                className="flex items-center justify-between rounded-md border p-2"
              >
                <div>
                  <p className="text-sm font-medium">{holiday.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(holiday.date)}
                    {holiday.movable && (
                      <span className="ml-2 rounded bg-warning/20 px-1 text-warning">móvel</span>
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(holiday.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
