import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfessorDashboardPage } from '@/pages/professor/ProfessorDashboardPage';
import { useAggregatedDashboard } from '@/hooks/use-professor';
import { createMockStudent } from '../factories';

vi.mock('@/hooks/use-professor', () => ({
  useAggregatedDashboard: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ProfessorDashboardPage', () => {
  const mockedUseAggregatedDashboard = vi.mocked(useAggregatedDashboard);

  it('shows loader state', () => {
    mockedUseAggregatedDashboard.mockReturnValue({ isLoading: true, error: null, data: null } as any);

    const { container } = render(
      <MemoryRouter>
        <ProfessorDashboardPage />
      </MemoryRouter>,
    );

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    mockedUseAggregatedDashboard.mockReturnValue({ isLoading: false, error: null, data: { students: [] } } as any);

    render(
      <MemoryRouter>
        <ProfessorDashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Sem alunos supervisionados/i)).toBeInTheDocument();
  });

  it('renders students from dashboard data', () => {
    mockedUseAggregatedDashboard.mockReturnValue({
      isLoading: false,
      error: null,
      data: { students: [createMockStudent()] },
    } as any);

    render(
      <MemoryRouter>
        <ProfessorDashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Dashboard do Professor/i)).toBeInTheDocument();
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
  });
});
