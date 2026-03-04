import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AccessCodeStatus,
  AccessCodeResponse,
  LinkedProfessor,
  SupervisedStudent,
  StudentDashboardData,
  AggregatedDashboard,
} from '@/types/professor';

// ─── Student-side hooks ─────────────────────────────────

export function useAccessCodeStatus() {
  return useQuery<AccessCodeStatus>({
    queryKey: ['professor-access-code'],
    queryFn: () => api.get('/professor/access-code'),
  });
}

export function useGenerateAccessCode() {
  const queryClient = useQueryClient();
  return useMutation<AccessCodeResponse>({
    mutationFn: () => api.post('/professor/access-code'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professor-access-code'] });
    },
  });
}

export function useRevokeAccessCode() {
  const queryClient = useQueryClient();
  return useMutation<void>({
    mutationFn: () => api.delete('/professor/access-code'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professor-access-code'] });
    },
  });
}

export function useLinkedProfessor() {
  return useQuery<LinkedProfessor | null>({
    queryKey: ['professor-link'],
    queryFn: () => api.get('/professor/link'),
  });
}

export function useRevokeLink() {
  const queryClient = useQueryClient();
  return useMutation<void>({
    mutationFn: () => api.delete('/professor/link'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professor-link'] });
    },
  });
}

// ─── Professor-side hooks ───────────────────────────────

export function useSupervisedStudents() {
  return useQuery<SupervisedStudent[]>({
    queryKey: ['professor-students'],
    queryFn: () => api.get('/professor/students'),
  });
}

export function useAggregatedDashboard() {
  return useQuery<AggregatedDashboard>({
    queryKey: ['professor-dashboard'],
    queryFn: () => api.get('/professor/dashboard'),
  });
}

export function useStudentDashboard(studentId: string) {
  return useQuery<StudentDashboardData>({
    queryKey: ['professor-dashboard', studentId],
    queryFn: () => api.get(`/professor/dashboard/${studentId}`),
    enabled: !!studentId,
  });
}

export function useStudentWorkLogs(studentId: string) {
  return useQuery<{ logs: unknown[]; total: number }>({
    queryKey: ['professor-work-logs', studentId],
    queryFn: () => api.get(`/professor/work-logs/${studentId}`),
    enabled: !!studentId,
  });
}
