import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { WorkLogTable } from '@/components/work-log/WorkLogTable';
import type { WorkLogListResponse } from '@/types';

const mutateAsync = vi.fn();

vi.mock('@/hooks/use-work-logs', () => ({
  useDeleteWorkLog: vi.fn(() => ({
    mutateAsync,
    isPending: false,
  })),
}));

vi.mock('@/components/work-log/WorkLogDialog', () => ({
  WorkLogDialog: () => <div data-testid="worklog-dialog" />,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: ReactNode }) => (open ? <div>{children}</div> : null),
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const data: WorkLogListResponse = {
  data: [
    {
      id: 'log-1',
      date: '2026-03-01',
      type: 'NORMAL',
      startTime: '09:00',
      endTime: '17:00',
      lunchStart: '12:00',
      lunchEnd: '13:00',
      calculatedHours: 7,
      company: 'StageSync',
      taskDescription: 'A'.repeat(120),
      justification: null,
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    },
  ],
  total: 22,
  page: 2,
  limit: 10,
  totalPages: 3,
};

describe('WorkLogTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading and empty states', () => {
    const { rerender } = render(
      <WorkLogTable data={undefined} isLoading page={1} onPageChange={vi.fn()} />,
    );

    expect(screen.getByText('A carregar...')).toBeInTheDocument();

    rerender(<WorkLogTable data={{ ...data, data: [], total: 0, totalPages: 0 }} isLoading={false} page={1} onPageChange={vi.fn()} />);
    expect(screen.getByText(/Sem registos de horas/i)).toBeInTheDocument();
  });

  it('renders filtered empty state when type filter has no matches', () => {
    render(<WorkLogTable data={data} isLoading={false} page={1} onPageChange={vi.fn()} typeFilter="HOLIDAY" />);

    expect(screen.getByText(/Nenhum registo encontrado/i)).toBeInTheDocument();
  });

  it('renders rows, toggles long description and handles pagination', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(<WorkLogTable data={data} isLoading={false} page={2} onPageChange={onPageChange} limit={10} />);

    expect(screen.getAllByText('Normal').length).toBeGreaterThan(0);
    expect(screen.getByText(/A mostrar 11–20 de 22 registos/i)).toBeInTheDocument();

    const toggleButtons = screen.getAllByRole('button', { name: /Ver mais/i });
    await user.click(toggleButtons[0]);
    expect(screen.getAllByRole('button', { name: /Ver menos/i }).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Seguinte' }));
    await user.click(screen.getByRole('button', { name: 'Última' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('opens delete confirmation and calls delete mutation', async () => {
    const user = userEvent.setup();

    render(<WorkLogTable data={data} isLoading={false} page={1} onPageChange={vi.fn()} />);

    const deleteButtons = screen.getAllByRole('button', { name: /Eliminar registo/i });
    await user.click(deleteButtons[0]);

    expect(screen.getByText(/Eliminar registo\?/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(mutateAsync).toHaveBeenCalledWith('log-1');
  });
});
