/**
 * Página: Dashboard
 * 
 * Dashboard principal com listagem de cotações
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CotacaoList } from '@/components/dashboard/CotacaoList';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { usuario, isAuthenticated, loading, logout } = useAuth();

  // Redireciona se não estiver autenticado
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !usuario) {
    return null; // Será redirecionado
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-dark mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600">
              Olá, {usuario.nome}! Gerencie suas cotações e acompanhe o status das propostas
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/cotacao/nova"
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
            >
              + Nova Cotação
            </Link>
            {usuario.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Admin
              </Link>
            )}
            <button
              onClick={logout}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Lista de Cotações */}
        <CotacaoList userId={usuario.id} />
      </div>
    </div>
  );
}

