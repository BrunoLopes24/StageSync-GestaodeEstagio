import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Holiday } from '@/types';

export function useHolidays(year?: number) {
  const y = year || new Date().getFullYear();
  return useQuery({
    queryKey: ['holidays', y],
    queryFn: () => api.get<Holiday[]>(`/holidays?year=${y}`),
  });
}

export function useGenerateHolidays() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (year: number) => api.post<Holiday[]>(`/holidays/generate/${year}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['holidays'] });
    },
  });
}

export function useDeleteHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/holidays/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['holidays'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
