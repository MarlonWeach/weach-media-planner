'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

interface Solicitante {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
}

interface Agencia {
  id: string;
  nome: string;
  ativo: boolean;
}

export default function AdminCadastrosPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [solicitantes, setSolicitantes] = useState<Solicitante[]>([]);
  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [novoSolicitanteNome, setNovoSolicitanteNome] = useState('');
  const [novoSolicitanteEmail, setNovoSolicitanteEmail] = useState('');
  const [novaAgenciaNome, setNovaAgenciaNome] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      carregarDados();
    }
  }, [isAdmin]);

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const carregarDados = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const headers = getAuthHeaders();
      const [resSolicitantes, resAgencias] = await Promise.all([
        fetch('/api/admin/solicitantes', { headers }),
        fetch('/api/admin/agencias', { headers }),
      ]);

      if (!resSolicitantes.ok || !resAgencias.ok) {
        throw new Error('Erro ao carregar cadastros.');
      }

      const dataSolicitantes = await resSolicitantes.json();
      const dataAgencias = await resAgencias.json();

      setSolicitantes(dataSolicitantes.solicitantes || []);
      setAgencias(dataAgencias.agencias || []);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar dados');
    } finally {
      setCarregando(false);
    }
  };

  const criarSolicitante = async () => {
    setErro(null);
    setSucesso(null);
    try {
      const response = await fetch('/api/admin/solicitantes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          nome: novoSolicitanteNome,
          email: novoSolicitanteEmail,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar solicitante');
      }

      setNovoSolicitanteNome('');
      setNovoSolicitanteEmail('');
      setSucesso('Solicitante criado com sucesso.');
      await carregarDados();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao criar solicitante');
    }
  };

  const criarAgencia = async () => {
    setErro(null);
    setSucesso(null);
    try {
      const response = await fetch('/api/admin/agencias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ nome: novaAgenciaNome }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar agência');
      }

      setNovaAgenciaNome('');
      setSucesso('Agência criada com sucesso.');
      await carregarDados();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao criar agência');
    }
  };

  const atualizarStatusSolicitante = async (id: string, ativo: boolean) => {
    setErro(null);
    setSucesso(null);
    try {
      const response = await fetch(`/api/admin/solicitantes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ ativo }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar solicitante');
      }

      setSucesso('Solicitante atualizado com sucesso.');
      await carregarDados();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao atualizar solicitante');
    }
  };

  const atualizarStatusAgencia = async (id: string, ativo: boolean) => {
    setErro(null);
    setSucesso(null);
    try {
      const response = await fetch(`/api/admin/agencias/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ ativo }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar agência');
      }

      setSucesso('Agência atualizada com sucesso.');
      await carregarDados();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao atualizar agência');
    }
  };

  if (authLoading || carregando) {
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-dark mb-2">Cadastros Base</h1>
            <p className="text-gray-600">Gerencie solicitantes e agências usadas no wizard.</p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Voltar
          </button>
        </div>

        {erro && <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{erro}</div>}
        {sucesso && <div className="p-3 rounded bg-green-50 text-green-700 border border-green-200">{sucesso}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-semibold">Solicitantes</h2>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nome do solicitante"
                value={novoSolicitanteNome}
                onChange={(e) => setNovoSolicitanteNome(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="email"
                placeholder="Email do solicitante"
                value={novoSolicitanteEmail}
                onChange={(e) => setNovoSolicitanteEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <button
                onClick={criarSolicitante}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Adicionar solicitante
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-auto">
              {solicitantes.map((item) => (
                <div key={item.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                  <div>
                    <p className="font-medium text-gray-900">{item.nome}</p>
                    <p className="text-sm text-gray-600">{item.email}</p>
                  </div>
                  <button
                    onClick={() => atualizarStatusSolicitante(item.id, !item.ativo)}
                    className={`px-3 py-1 text-sm rounded ${
                      item.ativo
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {item.ativo ? 'Inativar' : 'Ativar'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-semibold">Agências</h2>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nome da agência"
                value={novaAgenciaNome}
                onChange={(e) => setNovaAgenciaNome(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <button
                onClick={criarAgencia}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Adicionar agência
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-auto">
              {agencias.map((item) => (
                <div key={item.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                  <p className="font-medium text-gray-900">{item.nome}</p>
                  <button
                    onClick={() => atualizarStatusAgencia(item.id, !item.ativo)}
                    className={`px-3 py-1 text-sm rounded ${
                      item.ativo
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {item.ativo ? 'Inativar' : 'Ativar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
