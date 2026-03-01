import logoSrc from '@/assets/logo.svg';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <img
      src={logoSrc}
      alt="StageSync"
      className={cn('h-8 w-auto', className)}
    />
  );
}
