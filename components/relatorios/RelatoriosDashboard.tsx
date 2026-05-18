'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RelatorioComercialPayload } from '@/lib/relatorios/types';
import { SEGMENTOS_WIZARD } from '@/lib/cotacao/segmentosCotacao';
import { periodoMesAnteriorStrings } from '@/lib/relatorios/periodo';

const PERIODO_PADRAO = periodoMesAnteriorStrings();

function formatarMoeda(v: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v);
}

function BarraHorizontal({
  label,
  valor,
  max,
  extra,
}: {
  label: string;
  valor: number;
  max: number;
  extra?: string;
}) {
  const pct = max > 0 ? Math.min(100, (valor / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-800">{label}</span>
        <span className="text-gray-600">{extra ?? valor}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function RelatoriosDashboard({
  visaoGlobal,
  podeExportar,
}: {
  visaoGlobal: boolean;
  podeExportar: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RelatorioComercialPayload | null>(null);
  const [filtros, setFiltros] = useState({
    dataInicio: PERIODO_PADRAO.dataInicio,
    dataFim: PERIODO_PADRAO.dataFim,
    segmento: '',
    solicitanteId: '',
  });

  const opcoesSolicitantes = useMemo(
    () => data?.opcoesFiltro?.solicitantes ?? [],
    [data?.opcoesFiltro?.solicitantes]
  );

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Sessão expirada');
      const params = new URLSearchParams();
      if (filtros.dataInicio) params.set('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) params.set('dataFim', filtros.dataFim);
      if (filtros.segmento) params.set('segmento', filtros.segmento);
      if (filtros.solicitanteId) params.set('solicitanteId', filtros.solicitanteId);

      const res = await fetch(`/api/relatorios?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || 'Erro ao carregar relatório');
      }
      const j = await res.json();
      setData(j.relatorio);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const exportarExcel = async () => {
    if (!podeExportar) return;
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    const params = new URLSearchParams();
    if (filtros.dataInicio) params.set('dataInicio', filtros.dataInicio);
    if (filtros.dataFim) params.set('dataFim', filtros.dataFim);
    if (filtros.segmento) params.set('segmento', filtros.segmento);
    if (filtros.solicitanteId) params.set('solicitanteId', filtros.solicitanteId);
    params.set('format', 'xlsx');
    const res = await fetch(`/api/relatorios?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      setError(j?.error || 'Não foi possível exportar o relatório');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-comercial-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxBudgetPeriodo = Math.max(...(data?.porPeriodo.map((p) => p.budget) ?? [1]), 1);

  return (
    <div className="min-w-0 space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Filtros</h2>
        <p className="mb-3 text-sm text-gray-600">
          Período padrão: mês anterior. Ajuste as datas para analisar outros intervalos.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Data início</label>
            <input
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros((f) => ({ ...f, dataInicio: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Data fim</label>
            <input
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setFiltros((f) => ({ ...f, dataFim: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Segmento</label>
            <select
              value={filtros.segmento}
              onChange={(e) => setFiltros((f) => ({ ...f, segmento: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {SEGMENTOS_WIZARD.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          {visaoGlobal && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Comercial
              </label>
              <select
                value={filtros.solicitanteId}
                onChange={(e) => setFiltros((f) => ({ ...f, solicitanteId: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                {opcoesSolicitantes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void carregar()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Atualizar
          </button>
          {podeExportar && (
            <button
              type="button"
              onClick={() => void exportarExcel()}
              disabled={!data}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Exportar Excel (.xlsx)
            </button>
          )}
        </div>
        {!visaoGlobal && (
          <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Visão restrita às suas cotações. Exportação em Excel não está disponível para o perfil
            comercial.
          </p>
        )}
      </div>

      {loading && (
        <p className="text-center text-gray-600 py-12">Carregando relatório...</p>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>
      )}

      {data && !loading && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { t: 'Cotações', v: String(data.resumo.totalCotacoes) },
              { t: 'Budget total', v: formatarMoeda(data.resumo.budgetTotal) },
              { t: 'Ticket médio', v: formatarMoeda(data.resumo.ticketMedio) },
            ].map((kpi) => (
              <div
                key={kpi.t}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {kpi.t}
                </p>
                <p className="mt-1 text-xl font-bold text-primary-dark">{kpi.v}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Cotações por mês</h3>
              <div className="space-y-3">
                {data.porPeriodo.map((p) => (
                  <BarraHorizontal
                    key={p.periodo}
                    label={p.label}
                    valor={p.budget}
                    max={maxBudgetPeriodo}
                    extra={`${p.quantidade} · ${formatarMoeda(p.budget)}`}
                  />
                ))}
                {data.porPeriodo.length === 0 && (
                  <p className="text-sm text-gray-500">Sem dados no período.</p>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Por segmento</h3>
              <div className="space-y-3">
                {data.porSegmento.slice(0, 8).map((s) => (
                  <BarraHorizontal
                    key={s.segmento}
                    label={s.label}
                    valor={s.quantidade}
                    max={data.resumo.totalCotacoes || 1}
                    extra={`${s.quantidade} (${s.percentualQuantidade.toFixed(0)}%)`}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Mix médio por canal</h3>
              <div className="space-y-3">
                {data.mixMedioPorCanal.slice(0, 8).map((m) => (
                  <BarraHorizontal
                    key={m.canal}
                    label={m.label}
                    valor={m.percentualMedio}
                    max={100}
                    extra={`${m.percentualMedio.toFixed(1)}%`}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Por escopo de campanha</h3>
              <div className="flex flex-wrap gap-2">
                {data.porEscopo.map((e) => (
                  <span
                    key={e.escopo}
                    className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-900"
                  >
                    {e.label}: {e.quantidade}
                  </span>
                ))}
              </div>
              <h3 className="mb-3 mt-6 text-base font-semibold text-gray-900">Por objetivo</h3>
              <div className="space-y-2">
                {data.porObjetivo.map((o) => (
                  <div key={o.objetivo} className="flex justify-between text-sm">
                    <span>{o.label}</span>
                    <span className="text-gray-600">
                      {o.quantidade} · {formatarMoeda(o.budget)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {data.porComercial.length > 0 && (
            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm overflow-x-auto">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Por comercial</h3>
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b text-gray-600">
                    <th className="py-2 pr-4">Comercial</th>
                    <th className="py-2 pr-4 text-right">Cotações</th>
                    <th className="py-2 text-right">Budget</th>
                  </tr>
                </thead>
                <tbody>
                  {data.porComercial.map((c) => (
                    <tr key={c.comercialId} className="border-b border-gray-100">
                      <td className="py-2 pr-4">{c.nome}</td>
                      <td className="py-2 pr-4 text-right">{c.quantidade}</td>
                      <td className="py-2 text-right">{formatarMoeda(c.budget)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {data.desviosPrecoPerformance.length > 0 && (
            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm overflow-x-auto">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Desvios de preço (performance)
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                Ajustes entre preço de tabela e preço final na decisão interna.
              </p>
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b text-gray-600">
                    <th className="py-2 pr-3">Cotação</th>
                    <th className="py-2 pr-3">Cliente</th>
                    <th className="py-2 pr-3">Formato</th>
                    <th className="py-2 pr-3 text-right">Tabela</th>
                    <th className="py-2 pr-3 text-right">Final</th>
                    <th className="py-2 text-right">Desvio</th>
                  </tr>
                </thead>
                <tbody>
                  {data.desviosPrecoPerformance.map((d, i) => (
                    <tr key={`${d.cotacaoId}-${i}`} className="border-b border-gray-100">
                      <td className="py-2 pr-3 font-mono text-xs">{d.cotacaoId}</td>
                      <td className="py-2 pr-3">{d.clienteNome}</td>
                      <td className="py-2 pr-3">{d.formato}</td>
                      <td className="py-2 pr-3 text-right">{d.precoTabela}</td>
                      <td className="py-2 pr-3 text-right">{d.precoFinal}</td>
                      <td
                        className={`py-2 text-right font-medium ${
                          d.desvioPercent > 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {d.desvioPercent > 0 ? '+' : ''}
                        {d.desvioPercent}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </div>
  );
}
