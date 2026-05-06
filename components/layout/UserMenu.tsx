'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';

export function UserMenu() {
  const { usuario, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!usuario) return null;
  const iniciais = usuario.nome
    .split(' ')
    .map((parte) => parte[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 rounded-full border border-gray-300 bg-white px-3 py-1 hover:bg-gray-50"
      >
        <span className="hidden text-sm text-gray-700 md:block">{usuario.nome}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
          {iniciais}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          <div className="border-b border-gray-100 px-2 pb-2 mb-2">
            <p className="text-sm font-medium text-gray-900">{usuario.nome}</p>
            <p className="text-xs text-gray-500">{usuario.email}</p>
          </div>
          <Link
            href="/conta/ajustes"
            className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Ajustes da Conta
          </Link>
          <button
            type="button"
            onClick={logout}
            className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}

