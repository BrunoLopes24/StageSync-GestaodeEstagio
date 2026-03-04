export interface AccessCodeStatus {
  hasActiveCode: boolean;
  code?: string | null;
  createdAt?: string;
  expiresAt?: string;
}

export interface AccessCodeResponse {
  code: string;
  expiresAt: string;
}

export interface LinkedProfessor {
  professorId: string;
  professorEmail: string;
  linkedAt: string;
  isActive: boolean;
}

export interface SupervisedStudent {
  studentId: string;
  studentNumber: string | null;
  email: string;
  linkedAt: string;
}

export interface StudentDashboardData {
  student: {
    studentNumber: string | null;
    email: string;
    name: string | null;
  };
  stats: {
    totalHoursLogged: number;
    totalRequiredHours: number;
    percentComplete: number;
    remainingHours: number;
    remainingWorkDays: number;
    predictedEndDate: string | null;
    avgHoursPerDay: number;
    daysWorked: number;
    startDate: string;
  };
}

export interface AggregatedDashboardStudent {
  studentId: string;
  studentNumber: string | null;
  email: string;
  name?: string | null;
  totalHoursLogged: number;
  percentComplete: number;
  predictedEndDate: string | null;
  avgHoursPerDay: number;
}

export interface AggregatedDashboard {
  totalStudents: number;
  students: AggregatedDashboardStudent[];
}
