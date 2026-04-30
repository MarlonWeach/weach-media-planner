'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

type RoleUI = 'ADMIN' | 'MANAGER' | 'COMERCIAL';

interface UsuarioItem {
  id: string;
  nome: string;
  email: string;
  role: RoleUI;
  ativo: boolean;
}

interface SolicitanteItem {
  id: string;
  nome: string;
  email: string;
}

export default function AdminUsuariosPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();

  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [solicitantes, setSolicitantes] = useState<SolicitanteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const [novoSolicitanteId, setNovoSolicitanteId] = useState('');
  const [novoRole, setNovoRole] = useState<RoleUI>('COMERCIAL');
  const [novaSenha, setNovaSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroRole, setFiltroRole] = useState('');

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  const authHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('auth_token');
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  };

  const carregarDados = async () => {
    setLoading(true);
    setErro(null);
    try {
      const response = await fetch('/api/admin/usuarios', { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar usuários.');
      }
      setUsuarios(data.usuarios || []);
      setSolicitantes(data.solicitantes || []);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      carregarDados();
    }
  }, [isAdmin]);

  const criarUsuario = async () => {
    setErro(null);
    setSucesso(null);
    if (!novoSolicitanteId) {
      setErro('Selecione um solicitante para criar o usuário.');
      return;
    }
    if (!novaSenha || novaSenha.length < 6) {
      setErro('Defina uma senha com pelo menos 6 caracteres.');
      return;
    }

    try {
      const solicitanteSelecionado = solicitantes.find((item) => item.id === novoSolicitanteId);
      const response = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          solicitanteId: novoSolicitanteId,
          solicitanteEmail: solicitanteSelecionado?.email,
          role: novoRole,
          senha: novaSenha,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        const detalhes =
          Array.isArray(data?.details) && data.details.length > 0
            ? data.details
                .map((item: any) => {
                  const path = Array.isArray(item?.path) ? item.path.join('.') : 'campo';
                  const message = item?.message || 'valor inválido';
                  return `${path}: ${message}`;
                })
                .join(' | ')
            : null;
        throw new Error(detalhes || data.error || 'Erro ao criar usuário.');
      }

      setNovoSolicitanteId('');
      setNovaSenha('');
      setNovoRole('COMERCIAL');
      setSucesso('Usuário criado com sucesso.');
      await carregarDados();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao criar usuário.');
    }
  };

  const atualizarUsuario = async (
    id: string,
    payload: { role?: RoleUI; ativo?: boolean; senha?: string }
  ) => {
    setErro(null);
    setSucesso(null);
    try {
      const response = await fetch(`/api/admin/usuarios/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao atualizar usuário.');
      }
      setSucesso('Usuário atualizado com sucesso.');
      await carregarDados();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao atualizar usuário.');
    }
  };

  const usuariosFiltrados = usuarios.filter((item) => {
    const matchBusca =
      filtroBusca.trim() === '' ||
      item.nome.toLowerCase().includes(filtroBusca.toLowerCase()) ||
      item.email.toLowerCase().includes(filtroBusca.toLowerCase());
    const matchRole = filtroRole === '' || item.role === filtroRole;
    return matchBusca && matchRole;
  });

  if (authLoading || loading) {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-dark mb-2">Gestão de Usuários</h1>
            <p className="text-gray-600">Crie e gerencie acessos com base no cadastro de solicitantes.</p>
          </div>
          <button onClick={() => router.push('/admin')} className="px-4 py-2 text-gray-600 hover:text-gray-900">
            ← Voltar
          </button>
        </div>

        {erro && <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{erro}</div>}
        {sucesso && <div className="p-3 rounded bg-green-50 text-green-700 border border-green-200">{sucesso}</div>}

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold">Criar usuário por solicitante</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              id="novo-solicitante-id"
              name="novoSolicitanteId"
              value={novoSolicitanteId}
              onChange={(e) => setNovoSolicitanteId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Selecione um solicitante</option>
              {solicitantes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome} ({item.email})
                </option>
              ))}
            </select>
            <select
              id="novo-role"
              name="novoRole"
              value={novoRole}
              onChange={(e) => setNovoRole(e.target.value as RoleUI)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
              <option value="COMERCIAL">COMERCIAL</option>
            </select>
            <div className="relative">
              <input
                id="nova-senha"
                name="novaSenha"
                type={mostrarSenha ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg"
                placeholder="Senha inicial"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((prev) => !prev)}
                className="absolute inset-y-0 right-2 my-auto h-8 px-2 text-gray-500 hover:text-gray-700"
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {mostrarSenha ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <button onClick={criarUsuario} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
            Criar usuário
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold">Usuários</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              id="filtro-busca-usuarios"
              name="filtroBuscaUsuarios"
              type="text"
              value={filtroBusca}
              onChange={(e) => setFiltroBusca(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Buscar por nome ou email"
            />
            <select
              id="filtro-role-usuarios"
              name="filtroRoleUsuarios"
              value={filtroRole}
              onChange={(e) => setFiltroRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Todos os roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
              <option value="COMERCIAL">COMERCIAL</option>
            </select>
          </div>

          <div className="space-y-3">
            {usuariosFiltrados.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{item.nome}</p>
                    <p className="text-sm text-gray-600">{item.email}</p>
                    <p className="text-xs text-gray-500 mt-1">Status: {item.ativo ? 'Ativo' : 'Inativo'}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      id={`usuario-role-${item.id}`}
                      name={`usuarioRole-${item.id}`}
                      value={item.role}
                      onChange={(e) => {
                        const role = e.target.value as RoleUI;
                        void atualizarUsuario(item.id, { role });
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="COMERCIAL">COMERCIAL</option>
                    </select>
                    <button
                      onClick={() => void atualizarUsuario(item.id, { ativo: !item.ativo })}
                      className={`px-3 py-2 text-sm rounded ${
                        item.ativo
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {item.ativo ? 'Inativar' : 'Ativar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {usuariosFiltrados.length === 0 && (
              <div className="text-sm text-gray-500">Nenhum usuário encontrado.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
