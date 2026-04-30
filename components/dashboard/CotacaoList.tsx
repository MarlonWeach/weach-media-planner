/**
 * Componente: CotacaoList
 * 
 * Lista de cotações com filtros e busca
 */

'use client';

import { useState, useEffect } from 'react';
import { CotacaoCard } from './CotacaoCard';

interface Cotacao {
  id: string;
  clienteNome: string;
  clienteSegmento: string;
  budget: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
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

export function CotacaoList({ userId }: CotacaoListProps) {
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

  const buscarCotacoes = async () => {
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
  };

  useEffect(() => {
    buscarCotacoes();
  }, [filtros, paginacao.page]);

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPaginacao((prev) => ({ ...prev, page: 1 })); // Reset para primeira página
  };

  const segmentos = [
    { value: '', label: 'Todos os segmentos' },
    { value: 'AUTOMOTIVO', label: 'Automotivo' },
    { value: 'FINANCEIRO', label: 'Financeiro' },
    { value: 'VAREJO', label: 'Varejo' },
    { value: 'IMOBILIARIO', label: 'Imobiliário' },
    { value: 'SAUDE', label: 'Saúde' },
    { value: 'EDUCACAO', label: 'Educação' },
    { value: 'TELECOM', label: 'Telecom' },
    { value: 'SERVICOS', label: 'Serviços' },
    { value: 'OUTROS', label: 'Outros' },
  ];

  const formatarStatus = (status: string) =>
    status
      .toLowerCase()
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (letra) => letra.toUpperCase());

  if (loading && cotacoes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-600">Carregando cotações...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={buscarCotacoes}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              value={filtros.busca}
              onChange={(e) => handleFiltroChange('busca', e.target.value)}
              placeholder="Nome do cliente..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Segmento
            </label>
            <select
              value={filtros.segmento}
              onChange={(e) => handleFiltroChange('segmento', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {segmentos.map((seg) => (
                <option key={seg.value} value={seg.value}>
                  {seg.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filtros.status}
              onChange={(e) => handleFiltroChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Solicitante
            </label>
            <select
              value={filtros.solicitanteId}
              onChange={(e) => handleFiltroChange('solicitanteId', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Início
            </label>
            <input
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Fim
            </label>
            <input
              type="date"
              value={filtros.dataFim}
              onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Lista de Cotações */}
      {cotacoes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-600 mb-4">Nenhuma cotação encontrada</p>
          <a
            href="/cotacao/nova"
            className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Criar Nova Cotação
          </a>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cotacoes.map((cotacao) => (
              <CotacaoCard
                key={cotacao.id}
                id={cotacao.id}
                clienteNome={cotacao.clienteNome}
                clienteSegmento={cotacao.clienteSegmento}
                budget={cotacao.budget}
                status={cotacao.status}
                createdAt={new Date(cotacao.createdAt)}
                updatedAt={new Date(cotacao.updatedAt)}
                vendedorNome={cotacao.vendedor.nome}
                onDeleted={buscarCotacoes}
              />
            ))}
          </div>

          {/* Paginação */}
          {paginacao.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600">
                Mostrando {((paginacao.page - 1) * paginacao.limit) + 1} a{' '}
                {Math.min(paginacao.page * paginacao.limit, paginacao.total)} de{' '}
                {paginacao.total} cotações
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPaginacao((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={paginacao.page === 1}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Página {paginacao.page} de {paginacao.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPaginacao((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={paginacao.page >= paginacao.totalPages}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

