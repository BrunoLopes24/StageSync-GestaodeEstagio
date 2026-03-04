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
    <header className="relative flex h-16 items-center border-b bg-card px-3 sm:gap-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Logo className="absolute left-1/2 h-7 -translate-x-1/2 lg:hidden" />

      <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
        {displayName && (
          <span className="hidden max-w-[12rem] truncate text-right text-sm text-muted-foreground sm:block">
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
