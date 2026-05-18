/**
 * Página: Dashboard
 *
 * Listagem de cotações (tabela) e atalhos.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CotacaoList } from '@/components/dashboard/CotacaoList';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function DashboardPage() {
  const router = useRouter();
  const { usuario, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !usuario) {
    return null;
  }

  return (
    <div className="min-w-0 bg-gray-50 py-8">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-primary-dark">Dashboard</h1>
            <p className="text-gray-600">
              Olá, {usuario.nome}! Gerencie suas cotações e acompanhe o status das propostas.
            </p>
          </div>
          <Link
            href="/cotacao/nova"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary-dark"
          >
            + Nova Cotação
          </Link>
        </div>

        <CotacaoList userId={usuario.id} />
      </div>
    </div>
  );
}
