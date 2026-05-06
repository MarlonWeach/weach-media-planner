'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

interface FilaItem {
  id: string;
  clienteNome: string;
  clienteSegmento: string;
  objetivo: string;
  budget: number;
  createdAt: string;
  updatedAt: string;
  status: string;
  solicitanteNome: string;
  solicitanteEmail: string;
  vendedorNome: string;
  vendedorEmail: string;
  definicaoCampanha: string[];
}

interface ApiResponse {
  success: boolean;
  fila: FilaItem[];
  paginacao: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

const LIMIT = 20;

export default function AdminPerformanceFilaPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [fila, setFila] = useState<FilaItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtroBusca, setFiltroBusca] = useState('');

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
    if (filtroBusca.trim()) params.set('busca', filtroBusca.trim());
    return params.toString();
  }, [page, filtroBusca]);

  const carregarFila = async () => {
    setLoading(true);
    setErro(null);
    try {
      const response = await fetch(`/api/admin/performance-fila?${queryParams}`, {
        headers: authHeaders(),
      });
      const data: ApiResponse = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar fila de performance.');
      }
      setFila(data.fila || []);
      setTotalPages(data.paginacao?.totalPages || 1);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar fila de performance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      void carregarFila();
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
            <h1 className="text-3xl font-bold text-primary-dark mb-2">Fila de Performance</h1>
            <p className="text-gray-600">
              Cotações em <code>AGUARDANDO_APROVACAO</code> para decisão interna.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Home
            </button>
            <button onClick={() => router.push('/admin')} className="px-4 py-2 text-gray-600 hover:text-gray-900">
              ← Voltar
            </button>
          </div>
        </div>

        {erro && <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{erro}</div>}

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold">Filtros</h2>
          <input
            id="filtro-busca-fila-performance"
            name="filtroBuscaFilaPerformance"
            type="text"
            value={filtroBusca}
            onChange={(event) => setFiltroBusca(event.target.value)}
            placeholder="Buscar por ID ou cliente"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Itens na Fila</h2>
          <div className="space-y-3">
            {fila.length === 0 && (
              <div className="text-sm text-gray-500">Nenhuma cotação pendente de decisão no momento.</div>
            )}
            {fila.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{item.clienteNome}</p>
                    <p className="text-xs text-gray-500">{item.id}</p>
                    <p className="text-sm text-gray-600">
                      {item.objetivo} | {item.clienteSegmento} | {formatarMoeda(item.budget)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Solicitante: {item.solicitanteNome} ({item.solicitanteEmail})
                    </p>
                    <p className="text-xs text-gray-500">
                      Vendedor: {item.vendedorNome} ({item.vendedorEmail})
                    </p>
                    <p className="text-xs text-gray-500">
                      Campanha: {item.definicaoCampanha.length > 0 ? item.definicaoCampanha.join(', ') : 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/admin/performance-fila/${item.id}`)}
                      className="px-3 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white"
                    >
                      Abrir para decisão
                    </button>
                  </div>
                </div>
              </div>
            ))}
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

