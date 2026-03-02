import { Menu, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

interface TopBarProps {
  onMenuClick: () => void;
  title: string;
}

export function TopBar({ onMenuClick, title }: TopBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      <h1 className="text-lg font-semibold">{title}</h1>

      <div className="ml-auto flex items-center gap-3">
        {user && (
          <span className="text-sm text-muted-foreground">
            {user.studentNumber}
          </span>
        )}
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Terminar sessão">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
