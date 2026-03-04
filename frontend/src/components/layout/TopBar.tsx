import { Menu, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/hooks/use-settings';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, logout } = useAuth();
  const isStudent = user?.role === 'STUDENT';
  const { data: settings } = useSettings({
    enabled: isStudent && !!user?.id,
    userId: user?.id,
  });
  const navigate = useNavigate();

  let displayName = '';
  if (isStudent && user.role === 'STUDENT') {
    displayName = settings?.studentName || user.studentNumber || user.email || '';
  } else if (user?.role === 'PROFESSOR') {
    displayName = 'Professor';
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-card px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Logo className="h-7 lg:hidden" />

      <div className="ml-auto flex items-center gap-3">
        {displayName && (
          <span className="text-sm text-muted-foreground">
            {displayName}
          </span>
        )}
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Terminar sessão">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
