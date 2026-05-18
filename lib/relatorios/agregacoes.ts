import type { Objetivo, StatusCotacao } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { listarEscopoTagsCotacao } from '@/lib/cotacao/tagsEscopoDashboard';
import { extrairHistoricoPerformance } from '@/lib/performance/historico';
import { montarWhereCotacaoRelatorio } from '@/lib/relatorios/filtros';
import {
  labelCanal,
  labelEscopo,
  LABEL_OBJETIVO,
  LABEL_SEGMENTO,
  LABEL_STATUS,
} from '@/lib/relatorios/labels';
import type {
  DesvioPrecoItem,
  FiltrosRelatorio,
  RelatorioComercialPayload,
} from '@/lib/relatorios/types';
import type { EscopoTagId } from '@/lib/cotacao/tagsEscopoDashboard';

type CotacaoRow = {
  id: string;
  clienteNome: string;
  clienteSegmento: string;
  objetivo: string;
  budget: unknown;
  status: string;
  createdAt: Date;
  observacoes: string | null;
  mixSugerido: unknown;
  vendedorId: string;
  vendedor: { nome: string };
  solicitanteId: string | null;
  solicitanteNome: string | null;
  solicitante: { nome: string } | null;
};

function extrairMixLinhas(mixSugerido: unknown): Array<{ canal: string; percentual: number }> {
  if (!mixSugerido || typeof mixSugerido !== 'object') return [];
  const o = mixSugerido as Record<string, unknown>;
  const arr = Array.isArray(o.mix) ? o.mix : Array.isArray(mixSugerido) ? mixSugerido : [];
  return arr
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const canal = String(row.canal || '').trim();
      const percentual = Number(row.percentual);
      if (!canal || !Number.isFinite(percentual)) return null;
      return { canal: canal.toUpperCase(), percentual };
    })
    .filter((x): x is { canal: string; percentual: number } => x !== null);
}

function chaveMes(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function labelMes(chave: string): string {
  const [y, m] = chave.split('-');
  const meses = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];
  const idx = parseInt(m, 10) - 1;
  return `${meses[idx] || m}/${y}`;
}

export async function gerarRelatorioComercial(input: {
  filtros: FiltrosRelatorio;
  userId: string;
  visaoGlobal: boolean;
}): Promise<RelatorioComercialPayload> {
  const where = await montarWhereCotacaoRelatorio(
    input.filtros,
    input.userId,
    input.visaoGlobal
  );

  const cotacoes = await prisma.wp_Cotacao.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      clienteNome: true,
      clienteSegmento: true,
      objetivo: true,
      budget: true,
      status: true,
      createdAt: true,
      observacoes: true,
      mixSugerido: true,
      vendedorId: true,
      vendedor: { select: { nome: true } },
      solicitanteId: true,
      solicitanteNome: true,
      solicitante: { select: { nome: true } },
    },
  });

  const rows = cotacoes as CotacaoRow[];

  const budgets = rows.map((r) => Number(r.budget));
  const budgetTotal = budgets.reduce((a, b) => a + b, 0);
  const total = rows.length;

  const resumo = {
    totalCotacoes: total,
    budgetTotal,
    ticketMedio: total > 0 ? budgetTotal / total : 0,
  };

  const mapaPeriodo = new Map<string, { q: number; b: number }>();
  for (const r of rows) {
    const k = chaveMes(r.createdAt);
    const cur = mapaPeriodo.get(k) || { q: 0, b: 0 };
    cur.q += 1;
    cur.b += Number(r.budget);
    mapaPeriodo.set(k, cur);
  }
  const porPeriodo = [...mapaPeriodo.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodo, v]) => ({
      periodo,
      label: labelMes(periodo),
      quantidade: v.q,
      budget: v.b,
    }));

  const mapaSeg = new Map<string, { q: number; b: number }>();
  for (const r of rows) {
    const k = r.clienteSegmento;
    const cur = mapaSeg.get(k) || { q: 0, b: 0 };
    cur.q += 1;
    cur.b += Number(r.budget);
    mapaSeg.set(k, cur);
  }
  const porSegmento = [...mapaSeg.entries()]
    .sort((a, b) => b[1].b - a[1].b)
    .map(([segmento, v]) => ({
      segmento,
      label: LABEL_SEGMENTO[segmento as keyof typeof LABEL_SEGMENTO] || segmento,
      quantidade: v.q,
      budget: v.b,
      percentualQuantidade: total > 0 ? (v.q / total) * 100 : 0,
    }));

  const mapaStatus = new Map<string, number>();
  for (const r of rows) {
    mapaStatus.set(r.status, (mapaStatus.get(r.status) || 0) + 1);
  }
  const porStatus = [...mapaStatus.entries()].map(([status, quantidade]) => ({
    status: status as StatusCotacao,
    label: LABEL_STATUS[status as StatusCotacao] || status,
    quantidade,
    percentual: total > 0 ? (quantidade / total) * 100 : 0,
  }));

  const mapaVend = new Map<string, { nome: string; q: number; b: number }>();
  for (const r of rows) {
    const cur = mapaVend.get(r.vendedorId) || {
      nome: r.vendedor.nome,
      q: 0,
      b: 0,
    };
    cur.q += 1;
    cur.b += Number(r.budget);
    mapaVend.set(r.vendedorId, cur);
  }
  const porVendedor = [...mapaVend.entries()]
    .sort((a, b) => b[1].b - a[1].b)
    .map(([vendedorId, v]) => ({
      vendedorId,
      nome: v.nome,
      quantidade: v.q,
      budget: v.b,
    }));

  const mapaComercial = new Map<string, { nome: string; q: number; b: number }>();
  for (const r of rows) {
    const comercialId = r.solicitanteId
      ? `sol:${r.solicitanteId}`
      : `vend:${r.vendedorId}`;
    const nome =
      r.solicitante?.nome?.trim() ||
      r.solicitanteNome?.trim() ||
      r.vendedor.nome ||
      'Não informado';
    const cur = mapaComercial.get(comercialId) || { nome, q: 0, b: 0 };
    cur.q += 1;
    cur.b += Number(r.budget);
    mapaComercial.set(comercialId, cur);
  }
  const porComercial = [...mapaComercial.entries()]
    .sort((a, b) => b[1].b - a[1].b)
    .map(([comercialId, v]) => ({
      comercialId,
      nome: v.nome,
      quantidade: v.q,
      budget: v.b,
    }));

  const mapaObj = new Map<string, { q: number; b: number }>();
  for (const r of rows) {
    const k = r.objetivo;
    const cur = mapaObj.get(k) || { q: 0, b: 0 };
    cur.q += 1;
    cur.b += Number(r.budget);
    mapaObj.set(k, cur);
  }
  const porObjetivo = [...mapaObj.entries()].map(([objetivo, v]) => ({
    objetivo: objetivo as Objetivo,
    label: LABEL_OBJETIVO[objetivo as Objetivo] || objetivo,
    quantidade: v.q,
    budget: v.b,
  }));

  const mapaEscopo = new Map<EscopoTagId, number>();
  for (const r of rows) {
    const tags = listarEscopoTagsCotacao(r.observacoes, r.mixSugerido);
    for (const tag of tags) {
      mapaEscopo.set(tag, (mapaEscopo.get(tag) || 0) + 1);
    }
    if (tags.length === 0) {
      const sem = 'PROGRAMATICA' as EscopoTagId;
      mapaEscopo.set(sem, (mapaEscopo.get(sem) || 0) + 1);
    }
  }
  const porEscopo = [...mapaEscopo.entries()].map(([escopo, quantidade]) => ({
    escopo,
    label: labelEscopo(escopo),
    quantidade,
  }));

  const mixAcum = new Map<string, { soma: number; n: number }>();
  for (const r of rows) {
    for (const linha of extrairMixLinhas(r.mixSugerido)) {
      const cur = mixAcum.get(linha.canal) || { soma: 0, n: 0 };
      cur.soma += linha.percentual;
      cur.n += 1;
      mixAcum.set(linha.canal, cur);
    }
  }
  const mixMedioPorCanal = [...mixAcum.entries()]
    .map(([canal, v]) => ({
      canal,
      label: labelCanal(canal),
      percentualMedio: v.n > 0 ? v.soma / v.n : 0,
      ocorrencias: v.n,
    }))
    .sort((a, b) => b.percentualMedio - a.percentualMedio);

  const desviosPrecoPerformance: DesvioPrecoItem[] = [];
  for (const r of rows) {
    const hist = extrairHistoricoPerformance(r.observacoes);
    for (const reg of hist.registros) {
      if (reg.precoTabela <= 0) continue;
      const desvioPercent =
        ((reg.precoFinalAplicado - reg.precoTabela) / reg.precoTabela) * 100;
      if (Math.abs(desvioPercent) < 0.01) continue;
      desviosPrecoPerformance.push({
        cotacaoId: r.id,
        clienteNome: r.clienteNome,
        canal: reg.canal,
        formato: reg.formato,
        precoTabela: reg.precoTabela,
        precoFinal: reg.precoFinalAplicado,
        desvioPercent: Math.round(desvioPercent * 10) / 10,
      });
    }
  }
  desviosPrecoPerformance.sort(
    (a, b) => Math.abs(b.desvioPercent) - Math.abs(a.desvioPercent)
  );

  let opcoesFiltro: RelatorioComercialPayload['opcoesFiltro'];
  if (input.visaoGlobal) {
    const solicitantesDb = await prisma.wp_Solicitante.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    });
    opcoesFiltro = {
      solicitantes: solicitantesDb.map((s) => ({ id: s.id, nome: s.nome })),
    };
  }

  return {
    geradoEm: new Date().toISOString(),
    filtros: {
      dataInicio: input.filtros.dataInicioLabel ?? null,
      dataFim: input.filtros.dataFimLabel ?? null,
      segmento: input.filtros.segmento ?? null,
      solicitanteId: input.filtros.solicitanteId ?? null,
      escopoVisao: input.visaoGlobal ? 'todas' : 'proprias',
    },
    opcoesFiltro,
    resumo,
    porPeriodo,
    porSegmento,
    porStatus,
    porVendedor: input.visaoGlobal ? porVendedor : porVendedor.filter(
      (v) => v.vendedorId === input.userId
    ),
    porComercial,
    porObjetivo,
    porEscopo,
    mixMedioPorCanal,
    desviosPrecoPerformance: desviosPrecoPerformance.slice(0, 50),
  };
}

