import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  exportWorkLogsCsv,
  importWorkLogsCsv,
  useCreateWorkLog,
  useDeleteWorkLog,
  useUpdateWorkLog,
  useWorkLogs,
} from '@/hooks/use-work-logs';
import { useDashboard } from '@/hooks/use-dashboard';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/tokenManager', () => ({
  getAccessToken: vi.fn(() => 'token-1'),
}));

vi.mock('@/lib/api-base', () => ({
  resolveApiBase: vi.fn(() => 'http://localhost:3000/api/v1'),
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

describe('use-work-logs and use-dashboard hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches work logs with query params', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [], total: 0, page: 2, limit: 10, totalPages: 0 } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useWorkLogs({ from: '2026-03-01', to: '2026-03-31', page: 2, limit: 10 }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/work-logs?from=2026-03-01&to=2026-03-31&page=2&limit=10');
  });

  it('returns error state when work-logs API fails', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('network')); 

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useWorkLogs(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('network');
  });

  it('fetches dashboard stats', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ percentComplete: 30 } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDashboard(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/dashboard/stats');
    expect(result.current.data?.percentComplete).toBe(30);
  });

  it('create mutation posts data and invalidates related queries', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ id: 'log-1' } as never);
    const { wrapper, qc } = createWrapper();
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const { result } = renderHook(() => useCreateWorkLog(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        date: '2026-03-03',
        type: 'NORMAL',
        startTime: '09:00',
        endTime: '17:00',
      });
    });

    expect(api.post).toHaveBeenCalledWith('/work-logs', expect.objectContaining({ type: 'NORMAL' }));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['work-logs'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['dashboard'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reports'] });
  });

  it('update and delete mutations call API endpoints', async () => {
    vi.mocked(api.put).mockResolvedValueOnce({ id: 'log-1' } as never);
    vi.mocked(api.delete).mockResolvedValueOnce(undefined as never);

    const { wrapper } = createWrapper();
    const update = renderHook(() => useUpdateWorkLog(), { wrapper });
    await act(async () => {
      await update.result.current.mutateAsync({ id: 'log-1', taskDescription: 'Updated' });
    });

    const del = renderHook(() => useDeleteWorkLog(), { wrapper });
    await act(async () => {
      await del.result.current.mutateAsync('log-1');
    });

    expect(api.put).toHaveBeenCalledWith('/work-logs/log-1', { taskDescription: 'Updated' });
    expect(api.delete).toHaveBeenCalledWith('/work-logs/log-1');
  });

  it('exports CSV by downloading blob link', async () => {
    const blob = new Blob(['csv']);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: vi.fn().mockResolvedValue(blob) });
    vi.stubGlobal('fetch', fetchMock);

    const createObjectURL = vi.fn(() => 'blob:url');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });

    const click = vi.fn();
    const appendChild = vi.spyOn(document.body, 'appendChild');
    const removeChild = vi.spyOn(document.body, 'removeChild');
    const anchor = document.createElement('a');
    anchor.click = click;
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(anchor);

    await exportWorkLogsCsv();

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/v1/work-logs/export-csv', expect.any(Object));
    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendChild.mockRestore();
    removeChild.mockRestore();
  });

  it('imports CSV and surfaces backend errors', async () => {
    const okFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ created: 1, updated: 0, skipped: 0, total: 1, errors: [] }),
    });
    vi.stubGlobal('fetch', okFetch);

    const result = await importWorkLogsCsv('date,type\n2026-03-02,NORMAL');
    expect(result.created).toBe(1);

    const badFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'invalid csv' }),
    });
    vi.stubGlobal('fetch', badFetch);

    await expect(importWorkLogsCsv('bad')).rejects.toThrow('invalid csv');
  });
});
