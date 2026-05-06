'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

type OrigemDecisao = 'REVISAO' | 'EXCECAO';

interface RegistroPerformance {
  cotacaoId: string;
  canal: string;
  formato: string;
  modeloCompra: string;
  precoTabela: number;
  precoFinalAplicado: number;
  racionalTexto: string;
  racionalTags: string[];
  origemDecisao: OrigemDecisao;
}

interface CotacaoResponse {
  success: boolean;
  cotacao: {
    id: string;
    clienteNome: string;
    clienteSegmento: string;
    objetivo: string;
    budget: number;
    status: string;
    mixSugerido: unknown;
    logsPreco?: Array<{
      id: string;
      campo: string;
      valorAnterior: string;
      valorNovo: string;
      motivo: string;
      createdAt: string;
      usuario?: { nome: string; email: string } | null;
    }>;
  };
  error?: string;
}

interface HistoricoResponse {
  success: boolean;
  registros: RegistroPerformance[];
  error?: string;
}

interface MixItemFallback {
  canal?: string;
  formato?: string;
  modeloCompra?: string;
  precoUnitario?: number;
  preco?: number;
}

function asArrayMix(value: unknown): MixItemFallback[] {
  if (Array.isArray(value)) return value as MixItemFallback[];
  if (value && typeof value === 'object') {
    const source = value as { mix?: unknown };
    if (Array.isArray(source.mix)) return source.mix as MixItemFallback[];
  }
  return [];
}

function dedupeByKey(registros: RegistroPerformance[]): RegistroPerformance[] {
  const mapa = new Map<string, RegistroPerformance>();
  for (const registro of registros) {
    const key = `${registro.canal}|||${registro.formato}|||${registro.modeloCompra}`;
    mapa.set(key, registro);
  }
  return Array.from(mapa.values());
}

export default function AdminPerformanceDecisionPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finishingStatus, setFinishingStatus] = useState<'APROVADA' | 'RECUSADA' | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [decisaoComentario, setDecisaoComentario] = useState('');
  const [cotacaoMeta, setCotacaoMeta] = useState<{
    id: string;
    clienteNome: string;
    clienteSegmento: string;
    objetivo: string;
    budget: number;
    status: string;
  } | null>(null);
  const [registros, setRegistros] = useState<RegistroPerformance[]>([]);
  const [logsAuditoria, setLogsAuditoria] = useState<
    Array<{
      id: string;
      campo: string;
      valorAnterior: string;
      valorNovo: string;
      motivo: string;
      createdAt: string;
      usuario?: { nome: string; email: string } | null;
    }>
  >([]);

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
      const [cotacaoResp, historicoResp] = await Promise.all([
        fetch(`/api/cotacao/${params.id}`, { headers: authHeaders() }),
        fetch(`/api/admin/performance-historico?cotacaoId=${params.id}&limit=200`, {
          headers: authHeaders(),
        }),
      ]);

      const cotacaoData = (await cotacaoResp.json()) as CotacaoResponse;
      if (!cotacaoResp.ok || !cotacaoData.success || !cotacaoData.cotacao) {
        throw new Error(cotacaoData.error || 'Erro ao carregar cotação.');
      }

      const historicoData = (await historicoResp.json()) as HistoricoResponse;
      const historicoRegistros =
        historicoResp.ok && historicoData.success ? historicoData.registros || [] : [];

      let registrosNormalizados = dedupeByKey(historicoRegistros);

      if (registrosNormalizados.length === 0) {
        const fallbackRows = asArrayMix(cotacaoData.cotacao.mixSugerido).map((item) => ({
          cotacaoId: cotacaoData.cotacao.id,
          canal: String(item.canal || ''),
          formato: String(item.formato || ''),
          modeloCompra: String(item.modeloCompra || ''),
          precoTabela: Number(item.precoUnitario ?? item.preco ?? 0),
          precoFinalAplicado: Number(item.precoUnitario ?? item.preco ?? 0),
          racionalTexto: '',
          racionalTags: [],
          origemDecisao: 'REVISAO' as OrigemDecisao,
        }));

        registrosNormalizados = dedupeByKey(
          fallbackRows.filter(
            (row) => row.canal && row.formato && row.modeloCompra
          )
        );
      }

      setCotacaoMeta({
        id: cotacaoData.cotacao.id,
        clienteNome: cotacaoData.cotacao.clienteNome,
        clienteSegmento: cotacaoData.cotacao.clienteSegmento,
        objetivo: cotacaoData.cotacao.objetivo,
        budget: cotacaoData.cotacao.budget,
        status: cotacaoData.cotacao.status,
      });
      setRegistros(
        registrosNormalizados.map((item) => ({
          ...item,
          origemDecisao: item.origemDecisao === 'EXCECAO' ? 'EXCECAO' : 'REVISAO',
        }))
      );
      setLogsAuditoria(
        (cotacaoData.cotacao.logsPreco || []).filter((log) =>
          ['PERFORMANCE_STATUS_WORKFLOW', 'PERFORMANCE_PRECO_FINAL', 'PERFORMANCE_RACIONAL', 'PERFORMANCE_DECISAO_FINAL'].includes(log.campo)
        )
      );
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar dados para decisão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      void carregarDados();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, params.id]);

  const formatarMoeda = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const formatarDataHora = (value: string) =>
    new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));

  const podeSalvar = useMemo(() => {
    if (registros.length === 0) return false;
    return registros.every(
      (item) =>
        Number.isFinite(item.precoFinalAplicado) &&
        item.precoFinalAplicado >= 0 &&
        item.racionalTexto.trim().length > 0
    );
  }, [registros]);

  const atualizarRegistro = (
    index: number,
    partial: Partial<RegistroPerformance>
  ) => {
    setRegistros((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...partial };
      return next;
    });
  };

  const persistirHistorico = async (): Promise<void> => {
    if (!cotacaoMeta) throw new Error('Cotação inválida para salvar histórico.');
    setSaving(true);
    setErro(null);
    setSucesso(null);
    try {
      for (const registro of registros) {
        const response = await fetch('/api/admin/performance-historico', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({
            cotacaoId: cotacaoMeta.id,
            canal: registro.canal,
            formato: registro.formato,
            modeloCompra: registro.modeloCompra,
            precoTabela: registro.precoTabela,
            precoFinalAplicado: registro.precoFinalAplicado,
            racionalTexto: registro.racionalTexto,
            racionalTags: registro.racionalTags,
            motivoAjustePreco: '',
            origemDecisao: registro.origemDecisao,
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || `Erro ao salvar registro de ${registro.formato}.`);
        }
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error('Erro ao salvar decisão.');
    } finally {
      setSaving(false);
    }
  };

  const finalizarDecisao = async (status: 'APROVADA' | 'RECUSADA') => {
    if (!cotacaoMeta) return;
    setErro(null);
    setSucesso(null);
    setFinishingStatus(status);
    try {
      await persistirHistorico();

      const response = await fetch('/api/admin/performance-fila/decisao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          cotacaoId: cotacaoMeta.id,
          decisaoStatus: status,
          decisaoComentario: decisaoComentario.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao finalizar decisão.');
      }

      setSucesso(
        status === 'APROVADA'
          ? 'Cotação aprovada e e-mail final enviado ao solicitante.'
          : 'Cotação recusada e e-mail final enviado ao solicitante.'
      );
      router.push('/admin/performance-fila');
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao finalizar decisão e enviar e-mail.'
      );
    } finally {
      setFinishingStatus(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Carregando decisão de performance...</p>
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
            <h1 className="text-3xl font-bold text-primary-dark mb-2">
              Decisão de Performance
            </h1>
            {cotacaoMeta && (
              <p className="text-gray-600">
                {cotacaoMeta.clienteNome} | {cotacaoMeta.objetivo} |{' '}
                {formatarMoeda(cotacaoMeta.budget)} | status atual: {cotacaoMeta.status}
              </p>
            )}
          </div>
          <button
            onClick={() => router.push('/admin/performance-fila')}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            ← Voltar para fila
          </button>
        </div>

        {erro && <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{erro}</div>}
        {sucesso && <div className="p-3 rounded bg-green-50 text-green-700 border border-green-200">{sucesso}</div>}

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold">Itens para decisão</h2>
          {registros.length === 0 ? (
            <div className="text-sm text-gray-500">
              Nenhum item encontrado para registrar decisão nesta cotação.
            </div>
          ) : (
            <div className="space-y-4">
              {registros.map((registro, index) => (
                <div key={`${registro.canal}-${registro.formato}-${registro.modeloCompra}`} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold text-gray-900">
                      {registro.canal} | {registro.formato} ({registro.modeloCompra})
                    </p>
                    <p className="text-sm text-gray-600">
                      Preço de tabela: {formatarMoeda(registro.precoTabela)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      id={`preco-final-${index}`}
                      name={`precoFinal-${index}`}
                      type="number"
                      step="0.0001"
                      value={registro.precoFinalAplicado}
                      onChange={(event) =>
                        atualizarRegistro(index, {
                          precoFinalAplicado: Number(event.target.value),
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Preço final aplicado"
                    />
                    <input
                      id={`tags-${index}`}
                      name={`tags-${index}`}
                      type="text"
                      value={registro.racionalTags.join(', ')}
                      onChange={(event) =>
                        atualizarRegistro(index, {
                          racionalTags: event.target.value
                            .split(',')
                            .map((item) => item.trim())
                            .filter(Boolean),
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Tags (ex.: sem-historico, lead-qualificado, ticket-alto)"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Tags ajudam a classificar decisões para consultas e aprendizado da base histórica.
                  </p>

                  <textarea
                    id={`racional-${index}`}
                    name={`racional-${index}`}
                    value={registro.racionalTexto}
                    onChange={(event) =>
                      atualizarRegistro(index, { racionalTexto: event.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Racional da decisão"
                  />

                  <select
                    id={`origem-${index}`}
                    name={`origem-${index}`}
                    value={registro.origemDecisao}
                    onChange={(event) =>
                      atualizarRegistro(index, {
                        origemDecisao: event.target.value as OrigemDecisao,
                      })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="REVISAO">Revisão padrão</option>
                    <option value="EXCECAO">Exceção aprovada</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Status do workflow</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>
                <span className="font-medium">Status atual:</span>{' '}
                <code>{cotacaoMeta?.status || 'N/A'}</code>
              </p>
              <p>
                <span className="font-medium">Itens no histórico:</span> {registros.length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Trilha de auditoria</h3>
            {logsAuditoria.length === 0 ? (
              <p className="text-sm text-gray-500">Sem logs de auditoria para esta cotação até o momento.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-auto pr-1">
                {logsAuditoria.map((log) => (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500">
                      {formatarDataHora(log.createdAt)} | {log.usuario?.nome || log.usuario?.email || 'Sistema'}
                    </p>
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">{log.campo}</span>: {log.valorAnterior || '—'} → {log.valorNovo || '—'}
                    </p>
                    <p className="text-xs text-gray-600">{log.motivo || 'Sem motivo informado'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Envio final ao solicitante</h3>
          <textarea
            id="decisao-comentario-final"
            name="decisao-comentario-final"
            value={decisaoComentario}
            onChange={(event) => setDecisaoComentario(event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={3}
            placeholder="Observação opcional para compor o e-mail final"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => void finalizarDecisao('RECUSADA')}
            disabled={!podeSalvar || saving || !!finishingStatus}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {finishingStatus === 'RECUSADA' ? 'Enviando...' : 'Recusar e Enviar'}
          </button>
          <button
            type="button"
            onClick={() => void finalizarDecisao('APROVADA')}
            disabled={!podeSalvar || saving || !!finishingStatus}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {finishingStatus === 'APROVADA' ? 'Enviando...' : 'Aprovar e Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}

