export interface AuthUser {
  id: string;
  role: 'STUDENT' | 'ADMIN';
  studentNumber: string;
  email: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  isNewAccount: boolean;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}
