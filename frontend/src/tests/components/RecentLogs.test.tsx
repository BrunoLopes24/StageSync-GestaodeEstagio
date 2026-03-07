import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RecentLogs } from '@/components/dashboard/RecentLogs';
import { useWorkLogs } from '@/hooks/use-work-logs';

vi.mock('@/hooks/use-work-logs', () => ({
  useWorkLogs: vi.fn(),
}));

describe('RecentLogs', () => {
  const mockedUseWorkLogs = vi.mocked(useWorkLogs);

  it('shows empty state', () => {
    mockedUseWorkLogs.mockReturnValue({ data: { data: [] } } as never);

    render(
      <MemoryRouter>
        <RecentLogs />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Sem registos ainda/i)).toBeInTheDocument();
  });

  it('renders recent logs list', () => {
    mockedUseWorkLogs.mockReturnValue({
      data: {
        data: [
          {
            id: 'log-1',
            date: '2026-03-01',
            taskDescription: '',
            calculatedHours: 7,
          },
        ],
      },
    } as never);

    render(
      <MemoryRouter>
        <RecentLogs />
      </MemoryRouter>,
    );

    expect(screen.getByText('7.0h')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver todos/i })).toHaveAttribute('href', '/work-logs');
  });
});
