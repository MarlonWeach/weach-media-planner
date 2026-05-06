'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { UserMenu } from '@/components/layout/UserMenu';

export default function ContaAjustesPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarNovaSenha, setMostrarConfirmarNovaSenha] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/conta/ajustes');
    }
  }, [loading, isAuthenticated, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErro(null);
    setSucesso(null);
    setSalvando(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ senhaAtual, novaSenha, confirmarNovaSenha }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao alterar senha');
      }
      setSucesso('Senha alterada com sucesso.');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarNovaSenha('');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao alterar senha.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-dark mb-2">Ajustes da Conta</h1>
            <p className="text-gray-600">Altere sua senha de acesso</p>
          </div>
          <UserMenu />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {erro && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
              {erro}
            </div>
          )}
          {sucesso && (
            <div className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-green-700 text-sm">
              {sucesso}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha atual</label>
              <div className="relative">
                <input
                  type={mostrarSenhaAtual ? 'text' : 'password'}
                  value={senhaAtual}
                  onChange={(event) => setSenhaAtual(event.target.value)}
                  className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhaAtual((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                  aria-label={mostrarSenhaAtual ? 'Ocultar senha atual' : 'Mostrar senha atual'}
                >
                  {mostrarSenhaAtual ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nova senha</label>
              <div className="relative">
                <input
                  type={mostrarNovaSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(event) => setNovaSenha(event.target.value)}
                  className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarNovaSenha((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                  aria-label={mostrarNovaSenha ? 'Ocultar nova senha' : 'Mostrar nova senha'}
                >
                  {mostrarNovaSenha ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar nova senha</label>
              <div className="relative">
                <input
                  type={mostrarConfirmarNovaSenha ? 'text' : 'password'}
                  value={confirmarNovaSenha}
                  onChange={(event) => setConfirmarNovaSenha(event.target.value)}
                  className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmarNovaSenha((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                  aria-label={
                    mostrarConfirmarNovaSenha
                      ? 'Ocultar confirmação da nova senha'
                      : 'Mostrar confirmação da nova senha'
                  }
                >
                  {mostrarConfirmarNovaSenha ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : 'Alterar senha'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

