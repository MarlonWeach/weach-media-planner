'use client';

import { usePathname } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const ocultarHeader = pathname === '/login' || pathname.startsWith('/login/');

  if (ocultarHeader) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <AppHeader />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
