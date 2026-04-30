/**
 * Página: Admin - Dashboard
 * 
 * Dashboard principal do painel administrativo
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isAdmin, loading, router]);

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

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  const menuItems: {
    title: string;
    description: string;
    href: string;
    icon: string;
    color: string;
    disabled?: boolean;
  }[] = [
    {
      title: 'CPM Base Programático',
      description: 'Editar o valor central (D3) que determina todos os preços',
      href: '/admin/cpm-base',
      icon: '💰',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    },
    {
      title: 'Cadastros Base',
      description: 'Gerenciar solicitantes e agências do formulário',
      href: '/admin/cadastros',
      icon: '👥',
      color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
    },
    {
      title: 'Usuários de Acesso',
      description: 'Provisionar acesso por solicitante e gerenciar roles',
      href: '/admin/usuarios',
      icon: '🧑‍💼',
      color: 'bg-violet-50 border-violet-200 hover:bg-violet-100',
    },
    {
      title: 'Regras de Preço',
      description: 'Gerenciar fixos e condicionais em uma única tela',
      href: '/admin/regras-preco',
      icon: '📊',
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
    },
    {
      title: 'Margens Mínimas',
      description: 'Configurar margens mínimas por canal',
      href: '/admin/margens',
      icon: '📈',
      color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    },
    {
      title: 'Pisos e Tetos',
      description: 'Configurar pisos e tetos de preço',
      href: '/admin/pisos-tetos',
      icon: '⚖️',
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    },
    {
      title: 'Logs de Alterações',
      description: 'Visualizar histórico de alterações de preços',
      href: '/admin/logs',
      icon: '📝',
      color: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
    },
    {
      title: 'Histórico de Envios',
      description: 'Acompanhar cotações enviadas e status operacional',
      href: '/admin/envios',
      icon: '📤',
      color: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary-dark mb-2">
                Painel Administrativo
              </h1>
              <p className="text-gray-600">
                Gerencie configurações de precificação e regras do sistema
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Voltar ao Dashboard
            </Link>
          </div>
        </div>

        {/* Menu de Opções */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.disabled ? '#' : item.href}
              onClick={(e) => {
                if (item.disabled) {
                  e.preventDefault();
                }
              }}
              className={`${item.color} border-2 rounded-lg p-6 transition-all ${
                item.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer transform hover:scale-105'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{item.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {item.title}
                    {item.disabled && (
                      <span className="ml-2 text-xs text-gray-500">(Em breve)</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

