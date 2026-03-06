import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsCards } from '@/components/dashboard/StatsCards';

describe('StatsCards', () => {
  it('renders all metrics with predicted date', () => {
    render(
      <StatsCards
        stats={{
          totalHoursLogged: 120,
          totalRequiredHours: 400,
          percentComplete: 30,
          remainingHours: 280,
          remainingWorkDays: 40,
          predictedEndDate: '2026-07-01T12:00:00.000Z',
          avgHoursPerDay: 6,
          daysWorked: 20,
          startDate: '2026-01-01',
        }}
      />,
    );

    expect(screen.getByText('Horas Registadas')).toBeInTheDocument();
    expect(screen.getByText('120.0h')).toBeInTheDocument();
    expect(screen.getByText('de 400.0h')).toBeInTheDocument();
    expect(screen.getByText(/01\/07\/2026/)).toBeInTheDocument();
    expect(screen.getByText('20 dias trabalhados')).toBeInTheDocument();
  });

  it('renders completed state when predicted date is null', () => {
    render(
      <StatsCards
        stats={{
          totalHoursLogged: 400,
          totalRequiredHours: 400,
          percentComplete: 100,
          remainingHours: 0,
          remainingWorkDays: 0,
          predictedEndDate: null,
          avgHoursPerDay: 7,
          daysWorked: 58,
          startDate: '2026-01-01',
        }}
      />,
    );

    expect(screen.getByText('Concluído')).toBeInTheDocument();
    expect(screen.getByText('Parabéns!')).toBeInTheDocument();
  });
});
