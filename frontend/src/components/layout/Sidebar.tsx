import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Clock,
  BarChart3,
  Settings,
  Shield,
  Users,
  Monitor,
} from 'lucide-react';
import { Logo } from '@/components/Logo';

const studentLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/work-logs', label: 'Registo Diário', icon: Clock },
  { to: '/reports', label: 'Relatórios', icon: BarChart3 },
  { to: '/settings', label: 'Definições', icon: Settings },
];

const adminLinks = [
  { to: '/admin', label: 'Painel Admin', icon: Shield },
  { to: '/admin/students', label: 'Estudantes', icon: Users },
  { to: '/admin/sessions', label: 'Sessões', icon: Monitor },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function NavItem({ link, onClose }: { link: typeof studentLinks[0]; onClose: () => void }) {
  return (
    <NavLink
      to={link.to}
      end={link.to === '/admin'}
      onClick={onClose}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )
      }
    >
      <link.icon className="h-4 w-4" />
      {link.label}
    </NavLink>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r bg-card transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-center border-b px-6">
          <Logo className="h-7" />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {!isAdmin && studentLinks.map((link) => (
            <NavItem key={link.to} link={link} onClose={onClose} />
          ))}

          {isAdmin && (
            <>
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Administração
              </p>
              {adminLinks.map((link) => (
                <NavItem key={link.to} link={link} onClose={onClose} />
              ))}
            </>
          )}
        </nav>

        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground">Gestão de Estágio</p>
          <p className="text-xs text-muted-foreground">v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
