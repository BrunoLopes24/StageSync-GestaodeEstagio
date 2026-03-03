import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AdminDashboardStats,
  AdminStudentsResponse,
  AdminWorkLogsResponse,
  AdminSession,
} from '@/types/admin';

export function useAdminDashboard() {
  return useQuery<AdminDashboardStats>({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get('/admin/dashboard'),
    refetchInterval: 30_000,
  });
}

export function useAdminStudents(filters?: { active?: boolean; page?: number; limit?: number }) {
  const params = new URLSearchParams();
  if (filters?.active !== undefined) params.set('active', String(filters.active));
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();

  return useQuery<AdminStudentsResponse>({
    queryKey: ['admin', 'students', filters],
    queryFn: () => api.get(`/admin/students${qs ? `?${qs}` : ''}`),
  });
}

export function useAdminWorkLogs(filters?: { status?: string; userId?: string; page?: number; limit?: number }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.userId) params.set('userId', filters.userId);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();

  return useQuery<AdminWorkLogsResponse>({
    queryKey: ['admin', 'work-logs', filters],
    queryFn: () => api.get(`/admin/work-logs${qs ? `?${qs}` : ''}`),
  });
}

export function useAdminSessions() {
  return useQuery<AdminSession[]>({
    queryKey: ['admin', 'sessions'],
    queryFn: () => api.get('/admin/sessions'),
  });
}

export function useApproveWorkLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/admin/work-logs/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useRejectWorkLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.patch(`/admin/work-logs/${id}/reject`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/sessions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'sessions'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}
