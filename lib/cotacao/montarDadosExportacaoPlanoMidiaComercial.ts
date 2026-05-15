import type { DadosCotacao } from '@/lib/cotacao/planoMidiaTabelaComercial';

/** Campos mínimos da cotação para montar o mesmo payload do PDF comercial. */
export type CotacaoParaExportacaoPlano = {
  id: string;
  clienteNome: string;
  clienteSegmento: string;
  objetivo: string;
  budget: unknown;
  dataInicio: Date | null;
  dataFim: Date | null;
  regiao: string;
  mixSugerido: unknown;
  precosSugeridos: unknown;
  estimativas: unknown;
  vendedor: {
    nome: string;
    email: string;
  };
};

export function montarDadosCotacaoParaExportacaoPlano(
  cotacao: CotacaoParaExportacaoPlano,
  explicacaoComercial: string
): DadosCotacao {
  const mix = cotacao.mixSugerido as { mix?: unknown[] } | unknown[] | null | undefined;
  const mixRows = Array.isArray(mix) ? mix : (mix && typeof mix === 'object' && Array.isArray((mix as { mix?: unknown[] }).mix) ? (mix as { mix: unknown[] }).mix : []);
  const precos = cotacao.precosSugeridos;
  const estimativasRaw = cotacao.estimativas as Record<string, unknown> | null | undefined;
  const estimativas = {
    impressoes: Number(estimativasRaw?.impressoes || 0),
    cliques: Number(estimativasRaw?.cliques || 0),
    leads: Number(estimativasRaw?.leads || 0),
    cpmEstimado: Number(estimativasRaw?.cpmEstimado || 0),
    cpcEstimado: Number(estimativasRaw?.cpcEstimado || 0),
    cplEstimado: Number(estimativasRaw?.cplEstimado || 0),
  };
  if (estimativas.cpmEstimado <= 0 && estimativas.impressoes > 0) {
    estimativas.cpmEstimado = Number(cotacao.budget) / (estimativas.impressoes / 1000);
  }
  if (estimativas.cpcEstimado <= 0 && estimativas.cliques > 0) {
    estimativas.cpcEstimado = Number(cotacao.budget) / estimativas.cliques;
  }
  if (estimativas.cplEstimado <= 0 && estimativas.leads > 0) {
    estimativas.cplEstimado = Number(cotacao.budget) / estimativas.leads;
  }

  return {
    id: cotacao.id,
    clienteNome: cotacao.clienteNome,
    clienteSegmento: cotacao.clienteSegmento,
    objetivo: cotacao.objetivo,
    budget: Number(cotacao.budget),
    dataInicio: cotacao.dataInicio,
    dataFim: cotacao.dataFim,
    regiao: cotacao.regiao,
    explicacaoComercial,
    mix: mixRows as DadosCotacao['mix'],
    precos,
    estimativas,
    vendedor: {
      nome: cotacao.vendedor.nome,
      email: cotacao.vendedor.email,
    },
  };
}
