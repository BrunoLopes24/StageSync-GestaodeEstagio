import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Settings } from '@/types';

interface UseSettingsOptions {
  enabled?: boolean;
  userId?: string;
}

export function useSettings(options?: UseSettingsOptions) {
  return useQuery({
    queryKey: ['settings', options?.userId || 'anonymous'],
    enabled: options?.enabled ?? true,
    queryFn: () => api.get<Settings>('/settings'),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Settings>) => api.put<Settings>('/settings', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
