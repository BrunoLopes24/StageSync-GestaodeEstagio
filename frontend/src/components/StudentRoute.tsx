import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function StudentRoute() {
  const { user } = useAuth();

  if (user?.role !== 'STUDENT') {
    return <Navigate to="/professor" replace />;
  }

  return <Outlet />;
}
