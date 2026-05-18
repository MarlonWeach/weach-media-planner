/**
 * Componente: CotacaoList
 *
 * Listagem de cotações em tabela (dashboard), filtros e paginação.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { EscopoTagId } from '@/lib/cotacao/tagsEscopoDashboard';
import { SEGMENTOS_WIZARD } from '@/lib/cotacao/segmentosCotacao';
import { LABEL_ESCOPO_TAG } from '@/lib/cotacao/tagsEscopoDashboard';

interface Cotacao {
  id: string;
  clienteNome: string;
  clienteSegmento: string;
  budget: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  escopoTags: EscopoTagId[];
  vendedor: {
    nome: string;
    email: string;
  };
}

interface SolicitanteFiltro {
  id: string;
  nome: string;
  email: string;
}

interface CotacaoListProps {
  userId?: string;
}

function classeTagEscopo(id: EscopoTagId): string {
  if (id === 'PERFORMANCE') return 'bg-emerald-500/15 text-emerald-800 ring-1 ring-emerald-600/25';
  if (id === 'PROGRAMATICA') return 'bg-sky-500/15 text-sky-900 ring-1 ring-sky-600/25';
  return 'bg-violet-500/15 text-violet-900 ring-1 ring-violet-600/25';
}

export function CotacaoList({ userId }: CotacaoListProps) {
  const { isAdmin } = useAuth();
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({
    segmento: '',
    status: '',
    solicitanteId: '',
    busca: '',
    dataInicio: '',
    dataFim: '',
  });
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [solicitanteOptions, setSolicitanteOptions] = useState<SolicitanteFiltro[]>([]);
  const [paginacao, setPaginacao] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const buscarCotacoes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!userId) {
        throw new Error('Sessão inválida. Faça login novamente.');
      }

      const params = new URLSearchParams();
      if (filtros.segmento) params.append('segmento', filtros.segmento);
      if (filtros.status) params.append('status', filtros.status);
      if (filtros.solicitanteId) params.append('solicitanteId', filtros.solicitanteId);
      if (filtros.busca) params.append('busca', filtros.busca);
      if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) params.append('dataFim', filtros.dataFim);
      params.append('page', paginacao.page.toString());
      params.append('limit', paginacao.limit.toString());

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const response = await fetch(`/api/cotacao/list?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        throw new Error('Não autenticado. Faça login novamente.');
      }

      if (!response.ok) {
        throw new Error('Erro ao buscar cotações');
      }

      const data = await response.json();
      setCotacoes(data.cotacoes);
      setPaginacao(data.paginacao);
      setStatusOptions(data.filtros?.status || []);
      setSolicitanteOptions(data.filtros?.solicitantes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [filtros, paginacao.page, paginacao.limit, userId]);

  useEffect(() => {
    void buscarCotacoes();
  }, [buscarCotacoes]);

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPaginacao((prev) => ({ ...prev, page: 1 }));
  };

  const segmentos = [
    { value: '', label: 'Todos os segmentos' },
    ...SEGMENTOS_WIZARD.map((seg) => ({ value: seg.value, label: seg.label })),
  ];

  const formatarStatus = (status: string) =>
    status
      .toLowerCase()
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (letra) => letra.toUpperCase());

  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);

  const formatarNomeSegmento = (segmento: string) => {
    const nomes: Record<string, string> = {
      AUTOMOTIVO: 'Automotivo',
      FINANCEIRO: 'Financeiro',
      VAREJO: 'Varejo',
      IMOBILIARIO: 'Imobiliário',
      SAUDE: 'Saúde',
      EDUCACAO: 'Educação',
      TELECOM: 'Telecom',
      SERVICOS: 'Serviços',
      CPG_BENS_CONSUMO: 'CPG / Bens de consumo',
      PROMOCAO: 'Promoção',
      SAAS: 'SaaS',
      B2B: 'B2B',
      AGRO: 'Agro',
      TURISMO: 'Turismo',
      BELEZA_SAUDE: 'Beleza e saúde',
      OUTROS: 'Outros',
    };
    return nomes[segmento] || segmento;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      RASCUNHO: { label: 'Rascunho', className: 'bg-gray-100 text-gray-800' },
      ENVIADA: { label: 'Enviada', className: 'bg-blue-100 text-blue-800' },
      APROVADA: { label: 'Aprovada', className: 'bg-green-100 text-green-800' },
      RECUSADA: { label: 'Recusada', className: 'bg-red-100 text-red-800' },
      EM_EXECUCAO: { label: 'Em Execução', className: 'bg-purple-100 text-purple-800' },
      FINALIZADA: { label: 'Finalizada', className: 'bg-gray-100 text-gray-800' },
      AGUARDANDO_APROVACAO: {
        label: 'Aguardando Aprovação',
        className: 'bg-yellow-100 text-yellow-800',
      },
    };
    return badges[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
  };

  const excluirCotacao = async (id: string) => {
    const confirmou = window.confirm(
      'Tem certeza que deseja excluir esta cotação? Esta ação não pode ser desfeita.'
    );
    if (!confirmou) return;
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Sessão expirada');
      const response = await fetch(`/api/cotacao/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Erro ao excluir cotação');
      }
      void buscarCotacoes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir cotação.');
    }
  };

  if (loading && cotacoes.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
        <p className="text-gray-600">Carregando cotações...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">{error}</p>
        <button
          type="button"
          onClick={() => void buscarCotacoes()}
          className="mt-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Filtros</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Buscar</label>
            <input
              type="text"
              value={filtros.busca}
              onChange={(e) => handleFiltroChange('busca', e.target.value)}
              placeholder="Nome do cliente..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Segmento</label>
            <select
              value={filtros.segmento}
              onChange={(e) => handleFiltroChange('segmento', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-primary"
            >
              {segmentos.map((seg) => (
                <option key={seg.value} value={seg.value}>
                  {seg.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filtros.status}
              onChange={(e) => handleFiltroChange('status', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos os status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatarStatus(status)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Solicitante</label>
            <select
              value={filtros.solicitanteId}
              onChange={(e) => handleFiltroChange('solicitanteId', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos os solicitantes</option>
              {solicitanteOptions.map((solicitante) => (
                <option key={solicitante.id} value={solicitante.id}>
                  {solicitante.nome}
                  {solicitante.email ? ` (${solicitante.email})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Data Início</label>
            <input
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Data Fim</label>
            <input
              type="date"
              value={filtros.dataFim}
              onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {cotacoes.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center shadow-sm">
          <p className="mb-4 text-gray-600">Nenhuma cotação encontrada</p>
          <a
            href="/cotacao/nova"
            className="inline-block rounded-lg bg-primary px-6 py-2 text-white transition-colors hover:bg-primary-dark"
          >
            Criar Nova Cotação
          </a>
        </div>
      ) : (
        <>
          <div className="-mx-px overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">ID</th>
                  <th className="whitespace-nowrap px-4 py-3">Campanha</th>
                  <th className="whitespace-nowrap px-4 py-3">Escopo</th>
                  <th className="whitespace-nowrap px-4 py-3">Segmento</th>
                  <th className="whitespace-nowrap px-4 py-3">Budget</th>
                  <th className="whitespace-nowrap px-4 py-3">Status</th>
                  <th className="whitespace-nowrap px-4 py-3">Vendedor</th>
                  <th className="whitespace-nowrap px-4 py-3">Criada</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cotacoes.map((cotacao) => {
                  const st = getStatusBadge(cotacao.status);
                  const podeEditar = cotacao.status === 'RASCUNHO';
                  return (
                    <tr key={cotacao.id} className="hover:bg-gray-50/80">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-sm font-medium text-gray-900">
                        <span className="select-all">{cotacao.id}</span>
                      </td>
                      <td className="max-w-[220px] px-4 py-3">
                        <div className="truncate font-medium text-gray-900" title={cotacao.clienteNome}>
                          {cotacao.clienteNome}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {cotacao.escopoTags.length === 0 ? (
                            <span className="text-gray-400">—</span>
                          ) : (
                            cotacao.escopoTags.map((tag) => (
                              <span
                                key={tag}
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${classeTagEscopo(tag)}`}
                              >
                                {LABEL_ESCOPO_TAG[tag]}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {formatarNomeSegmento(cotacao.clienteSegmento)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-800">
                        {formatarMoeda(cotacao.budget)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${st.className}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="max-w-[160px] truncate px-4 py-3 text-gray-600" title={cotacao.vendedor.nome}>
                        {cotacao.vendedor.nome}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {dayjs(cotacao.createdAt).format('DD/MM/YYYY')}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {cotacao.status === 'AGUARDANDO_APROVACAO' && (
                            <Link
                              href={`/admin/performance-fila/${cotacao.id}`}
                              className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                            >
                              Responder
                            </Link>
                          )}
                          <Link
                            href={`/cotacao/${cotacao.id}`}
                            className="rounded-md border border-primary px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary hover:text-white"
                          >
                            Ver
                          </Link>
                          {podeEditar && (
                            <Link
                              href={`/cotacao/${cotacao.id}/editar`}
                              className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Editar
                            </Link>
                          )}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => void excluirCotacao(cotacao.id)}
                              className="rounded-md border border-red-300 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {paginacao.totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-gray-600">
                Mostrando {(paginacao.page - 1) * paginacao.limit + 1} a{' '}
                {Math.min(paginacao.page * paginacao.limit, paginacao.total)} de {paginacao.total}{' '}
                cotações
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaginacao((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={paginacao.page === 1}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Página {paginacao.page} de {paginacao.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPaginacao((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={paginacao.page >= paginacao.totalPages}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
