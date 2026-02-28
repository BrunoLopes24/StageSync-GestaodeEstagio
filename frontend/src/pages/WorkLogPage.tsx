import { useState } from 'react';
import { WorkLogTable } from '@/components/work-log/WorkLogTable';

export function WorkLogPage() {
  const [page, setPage] = useState(1);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Registos de Horas</h2>
        <p className="text-sm text-muted-foreground">
          Edite ou elimine os registos diários de trabalho.
        </p>
      </div>

      <WorkLogTable page={page} onPageChange={setPage} />
    </div>
  );
}
