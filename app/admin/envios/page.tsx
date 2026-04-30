'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

interface EnvioItem {
  id: string;
  clienteNome: string;
  objetivo: string;
  definicaoCampanha: string;
  status: string;
  dataEnvio: string;
  dataCriacao: string;
  budget: number;
  solicitanteNome: string;
  solicitanteEmail: string;
  agenciaNome: string;
  vendedorNome: string;
  vendedorEmail: string;
  pdfUrl?: string | null;
}

interface ApiResponse {
  success: boolean;
  envios: EnvioItem[];
  filtros: { status: string[] };
  paginacao: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

const LIMIT = 20;

export default function AdminEnviosPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [envios, setEnvios] = useState<EnvioItem[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

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

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(LIMIT));
    if (filtroStatus) params.set('status', filtroStatus);
    if (filtroBusca) params.set('busca', filtroBusca);
    if (filtroDataInicio) params.set('dataInicio', filtroDataInicio);
    if (filtroDataFim) params.set('dataFim', filtroDataFim);
    return params.toString();
  }, [page, filtroStatus, filtroBusca, filtroDataInicio, filtroDataFim]);

  const carregarEnvios = async () => {
    setLoading(true);
    setErro(null);
    try {
      const response = await fetch(`/api/admin/envios?${queryParams}`, {
        headers: authHeaders(),
      });
      const data: ApiResponse = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar histórico de envios.');
      }

      setEnvios(data.envios || []);
      setStatusOptions(data.filtros?.status || []);
      setTotalPages(data.paginacao?.totalPages || 1);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar histórico de envios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      carregarEnvios();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, queryParams]);

  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);

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
            <h1 className="text-3xl font-bold text-primary-dark mb-2">Histórico de Envios</h1>
            <p className="text-gray-600">Acompanhe o status operacional dos envios de cotação.</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todos</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <input
                type="text"
                value={filtroBusca}
                onChange={(e) => setFiltroBusca(e.target.value)}
                placeholder="ID ou cliente"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
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
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Envios</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data envio</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cotação</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Campanha</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Solicitante</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {envios.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-sm text-center text-gray-500">
                      Nenhum envio encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  envios.map((envio) => (
                    <tr key={envio.id} className="align-top">
                      <td className="px-3 py-2 text-sm whitespace-nowrap">
                        {new Date(envio.dataEnvio).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <div className="font-medium">{envio.clienteNome}</div>
                        <div className="text-gray-500 text-xs">{envio.id}</div>
                        <div className="text-gray-500 text-xs">{formatarMoeda(envio.budget)}</div>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <div>{envio.objetivo}</div>
                        <div className="text-gray-500 text-xs">{envio.definicaoCampanha}</div>
                      </td>
                      <td className="px-3 py-2 text-sm whitespace-nowrap">{envio.status}</td>
                      <td className="px-3 py-2 text-sm">
                        <div>{envio.solicitanteNome}</div>
                        <div className="text-gray-500 text-xs">{envio.solicitanteEmail}</div>
                        <div className="text-gray-500 text-xs">{envio.agenciaNome}</div>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <div>{envio.vendedorNome}</div>
                        <div className="text-gray-500 text-xs">{envio.vendedorEmail}</div>
                      </td>
                      <td className="px-3 py-2 text-sm whitespace-nowrap">
                        {envio.pdfUrl ? (
                          <a
                            href={envio.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Abrir PDF
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
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
