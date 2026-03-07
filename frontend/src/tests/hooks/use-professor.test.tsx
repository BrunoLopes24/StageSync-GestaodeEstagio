import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useAccessCodeStatus,
  useAggregatedDashboard,
  useGenerateAccessCode,
  useLinkedProfessor,
  useRevokeAccessCode,
  useRevokeLink,
  useStudentDashboard,
  useStudentWorkLogs,
  useSupervisedStudents,
} from '@/hooks/use-professor';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    qc,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  };
}

describe('use-professor hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches aggregated dashboard', async () => {
    vi.mocked(api.get).mockResolvedValue({ totalStudents: 1, students: [{ studentId: 's1' }] } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAggregatedDashboard(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.get).toHaveBeenCalledWith('/professor/dashboard');
    expect(result.current.data?.totalStudents).toBe(1);
  });

  it('returns error state on API failure', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('boom'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSupervisedStudents(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('boom');
  });

  it('loads access code status', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ hasActiveCode: true } as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAccessCodeStatus(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/professor/access-code');
  });

  it('generates access code and invalidates cache', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ message: 'ok' } as never);
    const { wrapper, qc } = createWrapper();
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useGenerateAccessCode(), { wrapper });

    await result.current.mutateAsync('prof@school.pt');

    expect(api.post).toHaveBeenCalledWith('/professor/access-code', { professorEmail: 'prof@school.pt' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['professor-access-code'] });
  });

  it('does not fetch student-scoped queries when student id is empty', () => {
    const { wrapper } = createWrapper();
    renderHook(() => useStudentDashboard(''), { wrapper });
    renderHook(() => useStudentWorkLogs(''), { wrapper });
    expect(api.get).not.toHaveBeenCalled();
  });

  it('loads linked professor data', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ professorId: 'p1' } as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLinkedProfessor(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/professor/link');
  });

  it('revoke mutations call API and invalidate relevant cache', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined as never);
    const { wrapper, qc } = createWrapper();
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const revokeCode = renderHook(() => useRevokeAccessCode(), { wrapper });
    await revokeCode.result.current.mutateAsync();

    const revokeLink = renderHook(() => useRevokeLink(), { wrapper });
    await revokeLink.result.current.mutateAsync();

    expect(api.delete).toHaveBeenCalledWith('/professor/access-code');
    expect(api.delete).toHaveBeenCalledWith('/professor/link');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['professor-access-code'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['professor-link'] });
  });
});
