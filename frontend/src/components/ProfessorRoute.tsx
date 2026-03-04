import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function ProfessorRoute() {
  const { user } = useAuth();

  if (user?.role !== 'PROFESSOR') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
