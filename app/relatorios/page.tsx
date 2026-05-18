'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { RelatoriosDashboard } from '@/components/relatorios/RelatoriosDashboard';

export default function RelatoriosPage() {
  const router = useRouter();
  const { usuario, loading, isAuthenticated } = useAuth();

  const podeVer =
    usuario?.role === 'ADMIN' ||
    usuario?.role === 'MANAGER' ||
    usuario?.role === 'COMERCIAL';

  const visaoGlobal = usuario?.role === 'ADMIN' || usuario?.role === 'MANAGER';
  const podeExportar = visaoGlobal;

  useEffect(() => {
    if (!loading && (!isAuthenticated || !podeVer)) {
      router.push('/dashboard');
    }
  }, [loading, isAuthenticated, podeVer, router]);

  if (loading || !isAuthenticated || !podeVer) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-w-0 bg-gray-50 py-8">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-primary-dark">
              Relatórios comerciais
            </h1>
            <p className="max-w-2xl text-gray-600">
              Insights de cotações, segmentos, mix e performance para apoiar decisões da
              diretoria. Dados internos do Media Planner — integração HubSpot em PBI futuro.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="shrink-0 text-sm text-primary hover:text-primary-dark"
          >
            ← Voltar ao dashboard
          </Link>
        </div>
        <RelatoriosDashboard visaoGlobal={visaoGlobal} podeExportar={podeExportar} />
      </div>
    </div>
  );
}
