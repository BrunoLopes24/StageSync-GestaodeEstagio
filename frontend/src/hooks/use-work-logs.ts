import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { WorkLog, WorkLogListResponse, WorkLogType } from '@/types';

export interface WorkLogInput {
  date: string;
  type: WorkLogType;
  startTime?: string;
  endTime?: string;
  lunchStart?: string;
  lunchEnd?: string;
  company?: string;
  taskDescription?: string;
  justification?: string;
}

export function useWorkLogs(params?: { from?: string; to?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());

  const qs = query.toString();
  return useQuery({
    queryKey: ['work-logs', params],
    queryFn: () => api.get<WorkLogListResponse>(`/work-logs${qs ? `?${qs}` : ''}`),
  });
}

export function useCreateWorkLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: WorkLogInput) => api.post<WorkLog>('/work-logs', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-logs'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useUpdateWorkLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<WorkLogInput>) =>
      api.put<WorkLog>(`/work-logs/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-logs'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDeleteWorkLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/work-logs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-logs'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export async function exportWorkLogsCsv(): Promise<void> {
  const response = await fetch('/api/v1/work-logs/export-csv');
  if (!response.ok) throw new Error('Falha ao exportar CSV');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'work-logs-backup.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importWorkLogsCsv(content: string): Promise<{ created: number; updated: number; total: number }> {
  const response = await fetch('/api/v1/work-logs/import-csv', {
    method: 'POST',
    headers: { 'Content-Type': 'text/csv' },
    body: content,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Falha ao importar CSV' }));
    throw new Error(err.error || 'Falha ao importar CSV');
  }
  return response.json();
}
