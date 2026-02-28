import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkLogs } from '@/hooks/use-work-logs';
import { formatDate, formatHours } from '@/lib/utils';
import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export function RecentLogs() {
  const { data } = useWorkLogs({ limit: 5 });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Registos Recentes
        </CardTitle>
        <Link to="/work-logs" className="text-sm text-primary hover:underline">
          Ver todos
        </Link>
      </CardHeader>
      <CardContent>
        {!data?.data.length ? (
          <p className="text-sm text-muted-foreground">Sem registos ainda.</p>
        ) : (
          <div className="space-y-3">
            {data.data.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{formatDate(log.date)}</p>
                  {log.taskDescription && (
                    <p className="text-xs text-muted-foreground">{log.taskDescription}</p>
                  )}
                </div>
                <span className="font-semibold text-primary">{formatHours(log.calculatedHours)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
