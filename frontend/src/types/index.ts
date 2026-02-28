export interface WorkLog {
  id: string;
  date: string;
  hours: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkLogListResponse {
  data: WorkLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  movable: boolean;
  year: number;
}

export interface Settings {
  id: string;
  totalRequiredHours: number;
  dailyWorkHours: number;
  workingDays: number[];
  startDate: string;
  internshipTitle: string | null;
  organizationName: string | null;
  supervisorName: string | null;
}

export interface DashboardStats {
  totalHoursLogged: number;
  totalRequiredHours: number;
  percentComplete: number;
  remainingHours: number;
  remainingWorkDays: number;
  predictedEndDate: string | null;
  avgHoursPerDay: number;
  daysWorked: number;
  startDate: string;
}

export interface WeeklySummary {
  weekNumber: number;
  startDate: string;
  endDate: string;
  totalHours: number;
  daysWorked: number;
  avgHoursPerDay: number;
  dailyBreakdown: { date: string; hours: number; notes: string | null }[];
}

export interface MonthlySummary {
  month: string;
  totalHours: number;
  daysWorked: number;
  avgHoursPerDay: number;
  weeklyBreakdown: { week: number; hours: number; days: number }[];
}
