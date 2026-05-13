'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { UserMenu } from '@/components/layout/UserMenu';

const HEADER_BG = '#1f2b51';

export function AppHeader() {
  const { isAuthenticated, usuario, loading, isAdmin } = useAuth();

  return (
    <header
      className="shadow-md print:hidden"
      style={{ backgroundColor: HEADER_BG }}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Weach — início">
            <Image
              src="/branding/weach-negative.png"
              alt="Weach"
              width={220}
              height={56}
              className="h-10 w-auto sm:h-11 md:h-12"
              priority
            />
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm font-medium text-white/95 sm:gap-3">
            <Link href="/" className="rounded-md px-2 py-1.5 hover:bg-white/10">
              Home
            </Link>
            {isAuthenticated && !loading && (
              <Link href="/dashboard" className="rounded-md px-2 py-1.5 hover:bg-white/10">
                Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" className="rounded-md px-2 py-1.5 hover:bg-white/10">
                Admin
              </Link>
            )}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!loading && !isAuthenticated && (
            <Link
              href="/login"
              className="rounded-md px-3 py-2 text-sm font-medium text-white ring-1 ring-white/40 hover:bg-white/10"
            >
              Entrar
            </Link>
          )}
          {isAuthenticated && usuario && <UserMenu variant="headerDark" />}
        </div>
      </div>
    </header>
  );
}
