/**
 * Tabela do plano de mídia e estimativas — mesma lógica do PDF comercial (geradorPDF).
 * Usado por PDF e exportação Excel para evitar divergência.
 */

import {
  modeloCompraCrmPorFormato,
  precoUnitarioCrmPorFormato,
} from './precosMensageriaCrm';
import { formatoCpvStreamersApenasNotion } from '@/lib/cotacao/formatosPrecoNotion';

export interface DadosCotacao {
  id: string;
  clienteNome: string;
  clienteSegmento: string;
  objetivo: string;
  budget: number;
  dataInicio?: Date | null;
  dataFim?: Date | null;
  regiao: string;
  explicacaoComercial?: string;
  mix: Array<{
    canal: string;
    percentual: number;
    formato?: string;
    modeloCompra?: string;
    valorBudget?: number;
    precoUnitario?: number;
    entregaEstimada?: number;
  }>;
  precos: unknown;
  estimativas: {
    impressoes: number;
    cliques: number;
    leads: number;
    cpmEstimado: number;
    cpcEstimado: number;
    cplEstimado: number;
  };
  vendedor: {
    nome: string;
    email: string;
  };
}

export type AlinhamentoColuna = 'left' | 'right';

export interface ColunaPlanoMidia {
  key: string;
  label: string;
  width: number;
  align: AlinhamentoColuna;
}

export function deveExibirMetricasLeads(objetivo: string): boolean {
  return objetivo === 'LEADS' || objetivo === 'VENDAS';
}

export function formatarMoeda(valor: number, casasDecimais = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  }).format(valor);
}

export function obterCasasDecimaisPreco(modeloCompra: string, canal?: string): number {
  if (modeloCompra === 'CPC') return 2;
  if (modeloCompra === 'CPV' && canal === 'CTV') return 4;
  if (modeloCompra === 'CPV') return 3;
  return 2;
}

export function formatarNumero(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
}

export function formatarData(data: Date | null | undefined): string {
  if (!data) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(data);
}

export function textoPeriodoCotacao(
  dataInicio?: Date | null,
  dataFim?: Date | null
): string {
  if (!dataInicio && !dataFim) return 'Período: a definir';
  if (dataInicio && dataFim) {
    return `Período: ${formatarData(dataInicio)} a ${formatarData(dataFim)}`;
  }
  if (dataInicio) return `Período: a partir de ${formatarData(dataInicio)}`;
  return `Período: até ${formatarData(dataFim)}`;
}

export function diasCorridosPeriodo(
  inicio?: Date | null,
  fim?: Date | null
): number | null {
  if (!inicio || !fim) return null;
  const ms = fim.getTime() - inicio.getTime();
  return Math.max(1, Math.ceil(ms / 86400000) + 1);
}

export function formatarSegmento(segmento: string): string {
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
}

export function formatarObjetivo(objetivo: string): string {
  const nomes: Record<string, string> = {
    AWARENESS: 'Awareness',
    CONSIDERACAO: 'Consideração',
    LEADS: 'Geração de Leads',
    VENDAS: 'Vendas',
  };
  return nomes[objetivo] || objetivo;
}

export function formatarNomeCanal(canal: string): string {
  const nomes: Record<string, string> = {
    DISPLAY_PROGRAMATICO: 'Display Programático',
    VIDEO_PROGRAMATICO: 'Vídeo Programático',
    CTV: 'CTV',
    AUDIO_DIGITAL: 'Áudio Digital',
    SOCIAL_PROGRAMATICO: 'Social Programático',
    CRM_MEDIA: 'CRM Media',
    IN_LIVE: 'In Live',
    CPL_CPI: 'CPL/CPI',
  };
  return nomes[canal] || canal.replace(/_/g, ' ');
}

function obterModeloCompra(canal: string, formato?: string): string {
  if (canal === 'CRM_MEDIA') {
    return modeloCompraCrmPorFormato(formato);
  }
  const modelos: Record<string, string> = {
    DISPLAY_PROGRAMATICO: 'CPM',
    VIDEO_PROGRAMATICO: 'CPV',
    CTV: 'CPV',
    AUDIO_DIGITAL: 'CPM',
    SOCIAL_PROGRAMATICO: 'CPC',
    IN_LIVE: 'CPM',
    CPL_CPI: 'CPL',
  };
  return modelos[canal] || 'CPM';
}

function obterPrecoUnitarioCanal(canal: string, precos: unknown, formato?: string): number {
  const p = precos as Record<string, unknown> | null | undefined;
  const crm = p?.crm as Partial<Record<'whatsappCpd' | 'smsCpd' | 'pushCpc', number>> | undefined;
  if (canal === 'DISPLAY_PROGRAMATICO') return Number((p?.display as { cpmBase?: number })?.cpmBase ?? 4);
  if (canal === 'VIDEO_PROGRAMATICO')
    return Number((p?.video as { cpvVideo30?: number })?.cpvVideo30 ?? 0.04);
  if (canal === 'CTV') return Number((p?.ctv as { cpvCtv30Open?: number })?.cpvCtv30Open ?? 0.04);
  if (canal === 'AUDIO_DIGITAL')
    return Number((p?.audio as { spotifyAudioCpm?: number })?.spotifyAudioCpm ?? 47);
  if (canal === 'SOCIAL_PROGRAMATICO')
    return Number((p?.social as { fbTrafego?: number })?.fbTrafego ?? 2.5);
  if (canal === 'CRM_MEDIA') {
    const f = (formato || '').toLowerCase();
    if (f.includes('whatsapp')) return Number(crm?.whatsappCpd ?? precoUnitarioCrmPorFormato(formato));
    if (f.includes('sms')) return Number(crm?.smsCpd ?? precoUnitarioCrmPorFormato(formato));
    if (f.includes('push')) return Number(crm?.pushCpc ?? precoUnitarioCrmPorFormato(formato));
    return precoUnitarioCrmPorFormato(formato);
  }
  if (canal === 'IN_LIVE') return 6;
  if (canal === 'CPL_CPI') return 50;
  return 1;
}

function obterDescricaoEntregaPorModelo(modeloCompra: string): string {
  const mapaDescricao: Record<string, string> = {
    CPM: 'impressões',
    CPC: 'cliques',
    CPV: 'complete views',
    CPL: 'leads',
    CPI: 'instalações',
    CPA: 'aquisições',
    CPD: 'disparos',
    CPE: 'engajamentos',
  };
  return mapaDescricao[modeloCompra] || 'entregas';
}

function calcularQuantidadeEntrega(
  modeloCompra: string,
  valorBudget: number,
  precoUnitario: number
): number {
  if (!Number.isFinite(precoUnitario) || precoUnitario <= 0) return 0;
  if (modeloCompra === 'CPM') {
    return Math.round((valorBudget / precoUnitario) * 1000);
  }
  return Math.round(valorBudget / precoUnitario);
}

function calcularCliquesEstimados(
  canal: string,
  modeloCompra: string,
  valorBudget: number,
  precoUnitario: number,
  impressoes: number
): number {
  if (!Number.isFinite(precoUnitario) || precoUnitario <= 0) return 0;
  if (modeloCompra === 'CPC' || modeloCompra === 'CPE') {
    return Math.round(valorBudget / precoUnitario);
  }
  if (modeloCompra === 'CPM') {
    const ctr = canal === 'SOCIAL_PROGRAMATICO' ? 0.02 : 0.004;
    return Math.round(impressoes * ctr);
  }
  return 0;
}

function calcularLeadsEstimados(
  modeloCompra: string,
  valorBudget: number,
  precoUnitario: number
): number {
  if (!Number.isFinite(precoUnitario) || precoUnitario <= 0) return 0;
  if (modeloCompra === 'CPL' || modeloCompra === 'CPA' || modeloCompra === 'CPI') {
    return Math.round(valorBudget / precoUnitario);
  }
  return 0;
}

function obterCvrEstimado(canal: string, formato: string, modeloCompra: string): number | null {
  if (modeloCompra !== 'CPV') return null;
  const f = formato || '';
  const fLower = f.toLowerCase();
  if (
    canal === 'CTV' ||
    fLower.includes('ctv') ||
    formatoCpvStreamersApenasNotion(f)
  ) {
    return 90;
  }
  if (f.includes('15')) return 80;
  if (f.includes('30')) return 75;
  return 75;
}

/** Percentual inteiro de CVR para CPV (tabela no projeto, PDF tabular e Excel). */
export function obterCvrPercentualCpvParaExibicao(
  canal: string,
  formato: string,
  modeloCompra: string
): number | null {
  return obterCvrEstimado(canal, formato, modeloCompra);
}

function calcularImpressoesEstimadas(
  canal: string,
  formato: string,
  modeloCompra: string,
  valorBudget: number,
  precoUnitario: number,
  entregaEstimada: number
): number {
  if (!Number.isFinite(precoUnitario) || precoUnitario <= 0) return 0;
  if (modeloCompra === 'CPM') {
    return Math.round((valorBudget / precoUnitario) * 1000);
  }
  if (modeloCompra === 'CPC' || modeloCompra === 'CPE') {
    const ctr = canal === 'SOCIAL_PROGRAMATICO' ? 0.02 : 0.004;
    return ctr > 0 ? Math.round(entregaEstimada / ctr) : 0;
  }
  if (modeloCompra === 'CPV') {
    const cvr = obterCvrEstimado(canal, formato, modeloCompra);
    if (!cvr) return 0;
    return Math.round(entregaEstimada / (cvr / 100));
  }
  return 0;
}

export interface LinhaMetricaPlanoMidia {
  canalTecnico: string;
  canal: string;
  formato: string;
  modeloCompra: string;
  percentual: number;
  valorBudget: number;
  precoUnitario: number;
  entregaQuantidade: number;
  entregaDescricao: string;
  impressoes: number;
  cliques: number;
  leads: number;
  /** Cliques / impressões, ou null se não aplicável */
  ctrRatio: number | null;
  cvrPercent: number | null;
}

export function faseCampanhaPorObjetivo(objetivo: string): string {
  switch (objetivo) {
    case 'AWARENESS':
      return 'Prospecção';
    case 'CONSIDERACAO':
      return 'Consideração';
    case 'LEADS':
      return 'Conversão';
    case 'VENDAS':
      return 'Vendas';
    default:
      return '—';
  }
}

export function textoKpiPrincipalCotacao(dados: DadosCotacao): string {
  const { objetivo, estimativas } = dados;
  if (objetivo === 'AWARENESS') {
    return `Impressões · eCPM ${formatarMoeda(estimativas.cpmEstimado)}`;
  }
  if (objetivo === 'CONSIDERACAO') {
    return `Tráfego · eCPC ${formatarMoeda(estimativas.cpcEstimado)}`;
  }
  if (objetivo === 'LEADS') {
    return `Leads · CPL ${formatarMoeda(estimativas.cplEstimado)}`;
  }
  if (objetivo === 'VENDAS') {
    return `Vendas · CPL ${formatarMoeda(estimativas.cplEstimado)}`;
  }
  return formatarObjetivo(objetivo);
}

/** Métricas por linha do mix (fonte única para PDF tabular e Excel modelo Weach). */
export function montarLinhasMetricasPlanoMidia(dados: DadosCotacao): LinhaMetricaPlanoMidia[] {
  return dados.mix.map((item) => {
    const valorBudget = Number.isFinite(Number(item.valorBudget))
      ? Number(item.valorBudget)
      : (dados.budget * item.percentual) / 100;
    const modeloCompra = item.modeloCompra || obterModeloCompra(item.canal, item.formato);
    const precoUnitario = Number.isFinite(Number(item.precoUnitario))
      ? Number(item.precoUnitario)
      : obterPrecoUnitarioCanal(item.canal, dados.precos, item.formato);
    const entregaQuantidade = Number.isFinite(Number(item.entregaEstimada))
      ? Number(item.entregaEstimada)
      : calcularQuantidadeEntrega(modeloCompra, valorBudget, precoUnitario);
    const entregaDescricao = obterDescricaoEntregaPorModelo(modeloCompra);
    const impressoes = calcularImpressoesEstimadas(
      item.canal,
      item.formato || '',
      modeloCompra,
      valorBudget,
      precoUnitario,
      entregaQuantidade
    );
    const cliques = calcularCliquesEstimados(
      item.canal,
      modeloCompra,
      valorBudget,
      precoUnitario,
      impressoes
    );
    const leads = calcularLeadsEstimados(modeloCompra, valorBudget, precoUnitario);
    const ctrRatio =
      impressoes > 0 && cliques > 0 ? cliques / impressoes : null;
    const cvrPercent = obterCvrEstimado(item.canal, item.formato || '', modeloCompra);

    return {
      canalTecnico: item.canal,
      canal: formatarNomeCanal(item.canal),
      formato: item.formato || '-',
      modeloCompra,
      percentual: item.percentual,
      valorBudget,
      precoUnitario,
      entregaQuantidade,
      entregaDescricao,
      impressoes,
      cliques,
      leads,
      ctrRatio,
      cvrPercent,
    };
  });
}

export function definirColunasPlanoMidia(exibirLeads: boolean): ColunaPlanoMidia[] {
  return [
    { key: 'canal', label: 'Canal', width: 56, align: 'left' },
    { key: 'formato', label: 'Formato', width: 70, align: 'left' },
    { key: 'modelo', label: 'Modelo', width: 34, align: 'left' },
    { key: 'preco', label: 'Preço', width: 36, align: 'right' },
    { key: 'pct', label: '%', width: 24, align: 'right' },
    { key: 'budget', label: 'Budget', width: 46, align: 'right' },
    { key: 'entrega', label: 'Entrega', width: 58, align: 'left' },
    { key: 'imp', label: 'Impr.', width: 38, align: 'right' },
    { key: 'ctr', label: 'CTR', width: 24, align: 'right' },
    { key: 'cvr', label: 'CVR', width: 24, align: 'right' },
    { key: 'cliques', label: 'Cliques', width: 38, align: 'right' },
    ...(exibirLeads ? [{ key: 'leads', label: 'Leads', width: 31, align: 'right' as const }] : []),
  ];
}

export function construirTabelaPlanoMidia(dados: DadosCotacao): {
  exibirLeads: boolean;
  colunas: ColunaPlanoMidia[];
  linhas: Record<string, string>[];
  totais: Record<string, string>;
} {
  const exibirLeads = deveExibirMetricasLeads(dados.objetivo);
  const colunas = definirColunasPlanoMidia(exibirLeads);
  const linhas: Record<string, string>[] = [];
  let totaisCliques = 0;
  let totaisLeads = 0;
  let totaisImpressoes = 0;

  const metricas = montarLinhasMetricasPlanoMidia(dados);
  metricas.forEach((m) => {
    totaisImpressoes += m.impressoes;
    totaisCliques += m.cliques;
    totaisLeads += m.leads;

    const ctr =
      m.ctrRatio != null ? `${(m.ctrRatio * 100).toFixed(2)}%` : '-';
    linhas.push({
      canal: m.canal,
      formato: m.formato,
      modelo: m.modeloCompra,
      preco: formatarMoeda(m.precoUnitario, obterCasasDecimaisPreco(m.modeloCompra, m.canalTecnico)),
      pct: `${m.percentual.toFixed(1)}%`,
      budget: formatarMoeda(m.valorBudget),
      entrega: `${formatarNumero(m.entregaQuantidade)} ${m.entregaDescricao}`,
      imp: m.impressoes > 0 ? formatarNumero(m.impressoes) : '-',
      ctr,
      cvr: m.cvrPercent != null ? `${m.cvrPercent}%` : '-',
      cliques: m.cliques > 0 ? formatarNumero(m.cliques) : '-',
      leads: m.leads > 0 ? formatarNumero(m.leads) : '-',
    });
  });

  const totalCtr = totaisImpressoes > 0 ? `${((totaisCliques / totaisImpressoes) * 100).toFixed(2)}%` : '-';
  const totais: Record<string, string> = {
    canal: 'TOTAIS',
    formato: '',
    modelo: '',
    preco: '',
    pct: '100.0%',
    budget: formatarMoeda(dados.budget),
    entrega: '',
    imp: totaisImpressoes > 0 ? formatarNumero(totaisImpressoes) : '-',
    ctr: totalCtr,
    cvr: '-',
    cliques: totaisCliques > 0 ? formatarNumero(totaisCliques) : '-',
    leads: totaisLeads > 0 ? formatarNumero(totaisLeads) : '-',
  };

  return { exibirLeads, colunas, linhas, totais };
}

/** Matriz [Métrica, Estimativa] incluindo cabeçalho na primeira linha (como no PDF). */
export function construirMatrizEstimativas(dados: DadosCotacao): string[][] {
  const linhas: string[][] = [
    ['Métrica', 'Estimativa'],
    ['Impressões', formatarNumero(dados.estimativas.impressoes)],
    ['Cliques', formatarNumero(dados.estimativas.cliques)],
    ['eCPM', formatarMoeda(dados.estimativas.cpmEstimado)],
    ['eCPC', formatarMoeda(dados.estimativas.cpcEstimado)],
    [
      'Taxa de Clique (eCTR)',
      dados.estimativas.impressoes > 0
        ? `${((dados.estimativas.cliques / dados.estimativas.impressoes) * 100).toFixed(2)}%`
        : '0.00%',
    ],
  ];
  if (deveExibirMetricasLeads(dados.objetivo)) {
    linhas.push(['Leads', formatarNumero(dados.estimativas.leads)]);
    linhas.push(['CPL', formatarMoeda(dados.estimativas.cplEstimado)]);
  }
  return linhas;
}

export function textoResumoExecutivo(dados: DadosCotacao): string {
  if (dados.explicacaoComercial?.trim()) {
    return dados.explicacaoComercial.trim();
  }
  return `Esta proposta foi desenvolvida para ${dados.clienteNome} no segmento ${formatarSegmento(dados.clienteSegmento)}, com foco em ${formatarObjetivo(dados.objetivo)}.`;
}
