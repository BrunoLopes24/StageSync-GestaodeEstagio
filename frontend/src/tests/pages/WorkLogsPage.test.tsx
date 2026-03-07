import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WorkLogPage } from '@/pages/WorkLogPage';

vi.mock('@/hooks/use-work-logs', () => ({
  useWorkLogs: vi.fn(),
  exportWorkLogsCsv: vi.fn(),
  importWorkLogsCsv: vi.fn(),
}));

vi.mock('@/hooks/use-dashboard', () => ({
  useDashboard: vi.fn(),
}));

vi.mock('@/components/work-log/WorkLogTable', () => ({
  WorkLogTable: () => <div data-testid="work-log-table" />,
}));

import { useWorkLogs } from '@/hooks/use-work-logs';
import { useDashboard } from '@/hooks/use-dashboard';

describe('WorkLogPage', () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  it('renders summary and csv actions', () => {
    vi.mocked(useWorkLogs).mockReturnValue({
      data: { total: 2 },
      isLoading: false,
    } as never);

    vi.mocked(useDashboard).mockReturnValue({
      data: { totalHoursLogged: 14, daysWorked: 2 },
    } as never);

    render(
      <QueryClientProvider client={queryClient}>
        <WorkLogPage />
      </QueryClientProvider>,
    );

    expect(screen.getByText(/Registos de Horas/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Exportar CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Importar CSV/i })).toBeInTheDocument();
    expect(screen.getByTestId('work-log-table')).toBeInTheDocument();
  });
});
