'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

interface RegistroHistorico {
  cotacaoId: string;
  clienteNome: string;
  clienteSegmento: string;
  objetivo: string;
  status: string;
  budget: number;
  vendedorNome: string;
  vendedorEmail: string;
  canal: string;
  formato: string;
  modeloCompra: string;
  precoTabela: number;
  precoFinalAplicado: number;
  racionalTexto: string;
  racionalTags: string[];
  motivoAjustePreco: string;
  origemDecisao: 'MANUAL' | 'REVISAO' | 'EXCECAO';
  atualizadoEm: string;
  atualizadoPor: string;
}

interface ApiResponse {
  success: boolean;
  registros: RegistroHistorico[];
  paginacao: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

const LIMIT = 20;

export default function AdminPerformanceHistoricoPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [registros, setRegistros] = useState<RegistroHistorico[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtroBusca, setFiltroBusca] = useState('');

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editPrecoFinal, setEditPrecoFinal] = useState('');
  const [editRacional, setEditRacional] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editMotivo, setEditMotivo] = useState('');
  const [editOrigem, setEditOrigem] = useState<'MANUAL' | 'REVISAO' | 'EXCECAO'>('MANUAL');

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

  const carregarRegistros = async () => {
    setLoading(true);
    setErro(null);
    try {
      const response = await fetch(`/api/admin/performance-historico?${queryParams}`, {
        headers: authHeaders(),
      });
      const data: ApiResponse = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar histórico.');
      }
      setRegistros(data.registros || []);
      setTotalPages(data.paginacao?.totalPages || 1);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar histórico.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      void carregarRegistros();
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

  const getRegistroKey = (registro: RegistroHistorico) =>
    `${registro.cotacaoId}|||${registro.canal}|||${registro.formato}|||${registro.modeloCompra}`;

  const iniciarEdicao = (registro: RegistroHistorico) => {
    setEditingKey(getRegistroKey(registro));
    setEditPrecoFinal(String(registro.precoFinalAplicado));
    setEditRacional(registro.racionalTexto);
    setEditTags((registro.racionalTags || []).join(', '));
    setEditMotivo(registro.motivoAjustePreco || '');
    setEditOrigem(registro.origemDecisao || 'MANUAL');
    setErro(null);
    setSucesso(null);
  };

  const cancelarEdicao = () => {
    setEditingKey(null);
    setEditPrecoFinal('');
    setEditRacional('');
    setEditTags('');
    setEditMotivo('');
    setEditOrigem('MANUAL');
  };

  const salvarEdicao = async (registro: RegistroHistorico) => {
    setErro(null);
    setSucesso(null);
    const precoFinalAplicado = Number(editPrecoFinal);
    if (!Number.isFinite(precoFinalAplicado) || precoFinalAplicado < 0) {
      setErro('Preço final inválido.');
      return;
    }
    if (!editRacional.trim()) {
      setErro('Racional é obrigatório.');
      return;
    }

    try {
      const response = await fetch('/api/admin/performance-historico', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          cotacaoId: registro.cotacaoId,
          canal: registro.canal,
          formato: registro.formato,
          modeloCompra: registro.modeloCompra,
          precoTabela: registro.precoTabela,
          precoFinalAplicado,
          racionalTexto: editRacional.trim(),
          racionalTags: editTags
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          motivoAjustePreco: editMotivo.trim(),
          origemDecisao: editOrigem,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao salvar atualização.');
      }
      setSucesso('Registro atualizado com sucesso.');
      cancelarEdicao();
      await carregarRegistros();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar atualização.');
    }
  };

  const baixarDatasetCsv = async () => {
    try {
      const response = await fetch('/api/admin/performance-historico/report?format=csv', {
        headers: authHeaders(),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Erro ao exportar CSV.');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'dataset-performance.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao exportar CSV.');
    }
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
            <h1 className="text-3xl font-bold text-primary-dark mb-2">Histórico de Performance (IA)</h1>
            <p className="text-gray-600">Mantenha racional e preço final por formato para treinar base histórica.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={baixarDatasetCsv}
              className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white"
            >
              Exportar CSV
            </button>
            <button onClick={() => router.push('/admin')} className="px-4 py-2 text-gray-600 hover:text-gray-900">
              ← Voltar
            </button>
          </div>
        </div>

        {erro && <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{erro}</div>}
        {sucesso && <div className="p-3 rounded bg-green-50 text-green-700 border border-green-200">{sucesso}</div>}

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold">Filtros</h2>
          <input
            id="filtro-busca-performance-historico"
            name="filtroBuscaPerformanceHistorico"
            type="text"
            value={filtroBusca}
            onChange={(event) => setFiltroBusca(event.target.value)}
            placeholder="Buscar por ID da cotação ou cliente"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Registros</h2>
          <div className="space-y-3">
            {registros.length === 0 && (
              <div className="text-sm text-gray-500">Nenhum registro encontrado para os filtros.</div>
            )}
            {registros.map((registro) => {
              const key = getRegistroKey(registro);
              const editing = key === editingKey;
              return (
                <div key={key} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{registro.clienteNome}</p>
                      <p className="text-xs text-gray-500">{registro.cotacaoId}</p>
                      <p className="text-sm text-gray-600">
                        {registro.canal} / {registro.formato} ({registro.modeloCompra})
                      </p>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Preço tabela: {formatarMoeda(registro.precoTabela)}</p>
                      <p>Preço final: {formatarMoeda(registro.precoFinalAplicado)}</p>
                    </div>
                  </div>

                  {editing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        id={`preco-final-${key}`}
                        name={`precoFinal-${key}`}
                        type="number"
                        value={editPrecoFinal}
                        onChange={(event) => setEditPrecoFinal(event.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Preço final aplicado"
                      />
                      <input
                        id={`tags-${key}`}
                        name={`tags-${key}`}
                        type="text"
                        value={editTags}
                        onChange={(event) => setEditTags(event.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Tags (separadas por vírgula)"
                      />
                      <textarea
                        id={`racional-${key}`}
                        name={`racional-${key}`}
                        value={editRacional}
                        onChange={(event) => setEditRacional(event.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg md:col-span-2"
                        rows={3}
                        placeholder="Racional humano"
                      />
                      <input
                        id={`motivo-${key}`}
                        name={`motivo-${key}`}
                        type="text"
                        value={editMotivo}
                        onChange={(event) => setEditMotivo(event.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Motivo do ajuste"
                      />
                      <select
                        id={`origem-${key}`}
                        name={`origem-${key}`}
                        value={editOrigem}
                        onChange={(event) =>
                          setEditOrigem(event.target.value as 'MANUAL' | 'REVISAO' | 'EXCECAO')
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="MANUAL">MANUAL</option>
                        <option value="REVISAO">REVISAO</option>
                        <option value="EXCECAO">EXCECAO</option>
                      </select>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>
                        <span className="font-medium">Racional:</span> {registro.racionalTexto || '—'}
                      </p>
                      <p>
                        <span className="font-medium">Tags:</span>{' '}
                        {(registro.racionalTags || []).length > 0 ? registro.racionalTags.join(', ') : '—'}
                      </p>
                      <p>
                        <span className="font-medium">Motivo:</span> {registro.motivoAjustePreco || '—'}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {editing ? (
                      <>
                        <button
                          onClick={() => void salvarEdicao(registro)}
                          className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={cancelarEdicao}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => iniciarEdicao(registro)}
                        className="px-3 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white"
                      >
                        Editar racional/preço
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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

