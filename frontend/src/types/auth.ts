export interface StudentUser {
  id: string;
  role: 'STUDENT';
  studentNumber: string;
  email: string;
}

export interface ProfessorUser {
  id: string;
  role: 'PROFESSOR';
}

export type AuthUser = StudentUser | ProfessorUser;

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  isNewAccount: boolean;
  user: AuthUser;
}

export interface ProfessorLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; role: 'PROFESSOR' };
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}
