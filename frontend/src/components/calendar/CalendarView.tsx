import { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  isWeekend,
  addMonths,
  subMonths,
} from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useWorkLogs } from '@/hooks/use-work-logs';
import { useHolidays } from '@/hooks/use-holidays';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WorkLogDialog } from '@/components/work-log/WorkLogDialog';

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const from = format(calendarStart, 'yyyy-MM-dd');
  const to = format(calendarEnd, 'yyyy-MM-dd');
  const { data: logsData } = useWorkLogs({ from, to, limit: 50 });
  const { data: holidays } = useHolidays(currentMonth.getFullYear());

  const logsByDate = useMemo(() => {
    const map = new Map<string, number>();
    logsData?.data.forEach((log) => {
      map.set(log.date.split('T')[0], log.calculatedHours);
    });
    return map;
  }, [logsData]);

  const holidaysByDate = useMemo(() => {
    const map = new Map<string, string>();
    holidays?.forEach((h) => {
      map.set(h.date.split('T')[0], h.name);
    });
    return map;
  }, [holidays]);

  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <>
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: pt })}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7">
          {weekDays.map((day) => (
            <div key={day} className="border-b p-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}

          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const hours = logsByDate.get(dateStr);
            const holiday = holidaysByDate.get(dateStr);
            const inMonth = isSameMonth(day, currentMonth);
            const weekend = isWeekend(day);
            const today = isToday(day);

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={cn(
                  'relative flex h-20 flex-col items-start border-b border-r p-1.5 text-left text-sm transition-colors hover:bg-accent/50',
                  !inMonth && 'opacity-30',
                  today && 'ring-2 ring-inset ring-primary',
                  weekend && 'bg-muted/30'
                )}
              >
                <span className={cn('text-xs', today && 'font-bold text-primary')}>
                  {format(day, 'd')}
                </span>
                {hours !== undefined && (
                  <span className="mt-auto rounded bg-primary/20 px-1 text-xs font-medium text-primary">
                    {hours.toFixed(1)}h
                  </span>
                )}
                {holiday && (
                  <span className="mt-0.5 truncate rounded bg-destructive/20 px-1 text-[10px] text-destructive" title={holiday}>
                    {holiday}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <WorkLogDialog
        open={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        defaultDate={selectedDate || undefined}
      />
    </>
  );
}
