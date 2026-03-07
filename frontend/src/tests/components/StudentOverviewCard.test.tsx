import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudentOverviewCard } from '@/components/professor/StudentOverviewCard';
import { createMockStudent } from '../factories';

describe('StudentOverviewCard', () => {
  it('renders student info and progress', () => {
    render(<StudentOverviewCard student={createMockStudent()} onViewLogs={vi.fn()} />);

    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('student@school.pt')).toBeInTheDocument();
    expect(screen.getByText('30.0%')).toBeInTheDocument();
    expect(screen.getByText(/Atividade Recente/i)).toBeInTheDocument();
  });

  it('calls onViewLogs when clicking button', async () => {
    const user = userEvent.setup();
    const onViewLogs = vi.fn();

    render(<StudentOverviewCard student={createMockStudent()} onViewLogs={onViewLogs} />);

    await user.click(screen.getByRole('button', { name: /Ver Registos/i }));

    expect(onViewLogs).toHaveBeenCalledTimes(1);
  });

  it('falls back to inferred name/email and hides recent section when no logs', () => {
    render(
      <StudentOverviewCard
        student={createMockStudent({
          name: ' ',
          email: 'joao.silva@school.pt',
          recentLogs: [],
          lastActivityDate: null,
        })}
        onViewLogs={vi.fn()}
      />,
    );

    expect(screen.getByText('Joao Silva')).toBeInTheDocument();
    expect(screen.getByText('Sem atividade')).toBeInTheDocument();
    expect(screen.queryByText(/Atividade Recente/i)).not.toBeInTheDocument();
  });
});
