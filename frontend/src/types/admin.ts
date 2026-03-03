export interface AdminDashboardStats {
  totalStudents: number;
  totalHoursLogged: number;
  pendingApprovals: number;
  activeSessions: number;
}

export interface AdminStudent {
  id: string;
  studentNumber: string;
  email: string;
  isActive: boolean;
  institution: string;
  userId: string | null;
  role: string | null;
  lastLoginAt: string | null;
  totalHours: number;
  logCount: number;
}

export interface AdminStudentsResponse {
  students: AdminStudent[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminWorkLog {
  id: string;
  date: string;
  type: string;
  startTime: string | null;
  endTime: string | null;
  lunchStart: string | null;
  lunchEnd: string | null;
  calculatedHours: number;
  company: string;
  taskDescription: string;
  justification: string | null;
  userId: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWorkLogsResponse {
  logs: AdminWorkLog[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminSession {
  id: string;
  userId: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: string;
  createdAt: string;
  user: {
    id: string;
    role: string;
    studentIdentity: {
      studentNumber: string;
      institutionalEmail: string;
    };
  };
}
