'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

interface UsuarioResumo {
  id: string;
  nome: string;
  email: string;
}

interface LogAlteracao {
  id: string;
  createdAt: string;
  campo: string;
  valorAnterior: string;
  valorNovo: string;
  motivo: string;
  usuarioId: string;
  usuario: UsuarioResumo;
}

interface ApiResponse {
  success: boolean;
  logs: LogAlteracao[];
  filtros: {
    campos: string[];
    usuarios: UsuarioResumo[];
  };
  paginacao: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

const LIMIT = 20;

const formatarCampo = (campo: string) =>
  campo
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatarValorParaTela = (value: string) => {
  if (!value) return '-';
  if (value === '-') return '-';

  try {
    const parsed = JSON.parse(value);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return value;
  }
};

export default function AdminLogsPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogAlteracao[]>([]);
  const [campos, setCampos] = useState<string[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filtroCampo, setFiltroCampo] = useState('');
  const [filtroUsuarioId, setFiltroUsuarioId] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  const authHeaders = (): HeadersInit => {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(LIMIT));
    if (filtroCampo) params.set('campo', filtroCampo);
    if (filtroUsuarioId) params.set('usuarioId', filtroUsuarioId);
    if (filtroDataInicio) params.set('dataInicio', filtroDataInicio);
    if (filtroDataFim) params.set('dataFim', filtroDataFim);
    return params.toString();
  }, [page, filtroCampo, filtroUsuarioId, filtroDataInicio, filtroDataFim]);

  const carregarLogs = async () => {
    setLoading(true);
    setErro(null);

    try {
      const response = await fetch(`/api/admin/logs?${queryParams}`, {
        headers: authHeaders(),
      });
      const data: ApiResponse = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar logs.');
      }

      setLogs(data.logs || []);
      setCampos(data.filtros?.campos || []);
      setUsuarios(data.filtros?.usuarios || []);
      setTotalPages(data.paginacao?.totalPages || 1);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      carregarLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, queryParams]);

  const aplicarFiltros = () => {
    setPage(1);
    carregarLogs();
  };

  const limparFiltros = () => {
    setFiltroCampo('');
    setFiltroUsuarioId('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setPage(1);
  };

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
            <h1 className="text-3xl font-bold text-primary-dark mb-2">Logs de Alterações</h1>
            <p className="text-gray-600">Acompanhe o histórico de auditoria das mudanças de pricing.</p>
          </div>
          <button onClick={() => router.push('/admin')} className="px-4 py-2 text-gray-600 hover:text-gray-900">
            ← Voltar
          </button>
        </div>

        {erro && <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{erro}</div>}

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de alteração</label>
              <select
                value={filtroCampo}
                onChange={(e) => setFiltroCampo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todos</option>
                {campos.map((campo) => (
                  <option key={campo} value={campo}>
                    {formatarCampo(campo)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
              <select
                value={filtroUsuarioId}
                onChange={(e) => setFiltroUsuarioId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todos</option>
                {usuarios.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nome} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data início</label>
              <input
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data fim</label>
              <input
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={aplicarFiltros} className="px-6 py-2 bg-primary text-white rounded-lg">
              Aplicar filtros
            </button>
            <button onClick={limparFiltros} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg">
              Limpar
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Histórico</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Antes</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Depois</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-sm text-center text-gray-500">
                      Nenhum log encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="align-top">
                      <td className="px-3 py-2 text-sm whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <div className="font-medium">{log.usuario?.nome || '-'}</div>
                        <div className="text-gray-500">{log.usuario?.email || '-'}</div>
                      </td>
                      <td className="px-3 py-2 text-sm whitespace-nowrap">{formatarCampo(log.campo)}</td>
                      <td className="px-3 py-2 text-xs text-gray-700 max-w-xs">
                        <pre className="whitespace-pre-wrap break-words">{formatarValorParaTela(log.valorAnterior)}</pre>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-700 max-w-xs">
                        <pre className="whitespace-pre-wrap break-words">{formatarValorParaTela(log.valorNovo)}</pre>
                      </td>
                      <td className="px-3 py-2 text-sm">{log.motivo}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded border border-gray-300 disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded border border-gray-300 disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
