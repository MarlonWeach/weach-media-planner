/**
 * Agente IA - Media Planner
 * 
 * Responsável por gerar mix de canais e distribuição de budget.
 * Baseado em: docs/prompts/prompt-gerador-de-plano.md
 */

import OpenAI from 'openai';
import {
  aplicarLimitesEstrategicosFormatos,
  montarTabelaPesosFormatoPrompt,
  pesoFormatoParaObjetivo,
} from '@/lib/ia/pesosFormatoObjetivo';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ParametrosMediaPlanner {
  segmento: string;
  objetivo: string;
  budgetTotal: number;
  regiao: string;
  maturidadeDigital: string;
  toleranciaRisco: string;
  inventariosDisponiveis: string[];
  preferenciasCliente?: {
    evitarCanais?: string[];
    preferirCanais?: string[];
  };
}

export interface MixCanal {
  canal: string;
  percentual: number;
  justificativa?: string;
}

export type OrigemMixCanais = 'ia' | 'fallback_padrao';

export interface RespostaMediaPlanner {
  mix: MixCanal[];
  racional: string;
  /** Origem do mix agregado por canal (distinto da distribuição % por formato). */
  origemMix: OrigemMixCanais;
}

export interface FormatoPlanoEntrada {
  canal: string;
  formato: string;
  modeloCompra: string;
}

export type OrigemDistribuicaoFormato = 'ia' | 'fallback_pesos';

export interface RespostaDistribuicaoFormato {
  formatos: Array<FormatoPlanoEntrada & { percentual: number }>;
  origem: OrigemDistribuicaoFormato;
  racional?: string;
}

const FORMATO_CPM_DISPLAY_NATIVE = 'cpm - display e/ou native';
const FORMATO_CPM_GAMA_DSP = 'cpm - gama dsp';

/** Mix de referência por canal (fallback e direcional para IA). Percentuais somam 100. */
const MIX_REFERENCIA_POR_OBJETIVO: Record<string, MixCanal[]> = {
  awareness: [
    { canal: 'display_programatico', percentual: 26 },
    { canal: 'video_programatico', percentual: 32 },
    { canal: 'ctv', percentual: 32 },
    { canal: 'social_programatico', percentual: 10 },
  ],
  leads: [
    { canal: 'social_programatico', percentual: 45 },
    { canal: 'display_programatico', percentual: 45 },
    { canal: 'crm_media', percentual: 10 },
  ],
  vendas: [
    { canal: 'social_programatico', percentual: 45 },
    { canal: 'display_programatico', percentual: 45 },
    { canal: 'crm_media', percentual: 10 },
  ],
  consideracao: [
    { canal: 'display_programatico', percentual: 55 },
    { canal: 'video_programatico', percentual: 15 },
    { canal: 'social_programatico', percentual: 25 },
    { canal: 'ctv', percentual: 5 },
  ],
};

/** Teto agregado de % de budget em linhas com modelo CPC, quando CPC está na seleção. */
const TETO_CPC_AGREGADO_POR_OBJETIVO: Record<string, number> = {
  leads: 10,
  vendas: 10,
  consideracao: 40,
};

function normalizarObjetivo(objetivo: string): string {
  return (objetivo || '').trim().toLowerCase();
}

function obterMixReferenciaPorObjetivo(objetivo: string): MixCanal[] {
  const chave = normalizarObjetivo(objetivo);
  return MIX_REFERENCIA_POR_OBJETIVO[chave] ?? MIX_REFERENCIA_POR_OBJETIVO.consideracao;
}

function formatarMixReferenciaTexto(mix: MixCanal[]): string {
  return mix.map((m) => `${m.canal} ~${m.percentual}%`).join(', ');
}

export function isModeloCompraCpc(modeloCompra: string): boolean {
  const modelo = modeloCompra.toUpperCase();
  return modelo === 'CPC' || modelo.startsWith('CPC_');
}

export function obterTetoAgregadoCpcPorObjetivo(objetivo: string): number | null {
  const chave = normalizarObjetivo(objetivo);
  return TETO_CPC_AGREGADO_POR_OBJETIVO[chave] ?? null;
}

/**
 * Limita a soma de % em formatos CPC e redistribui o excedente entre os demais.
 */
export function aplicarTetoAgregadoCpc(
  formatos: Array<FormatoPlanoEntrada & { percentual: number }>,
  objetivo: string
): Array<FormatoPlanoEntrada & { percentual: number }> {
  const teto = obterTetoAgregadoCpcPorObjetivo(objetivo);
  if (teto === null || formatos.length === 0) {
    return formatos;
  }

  const indicesCpc: number[] = [];
  const indicesOutros: number[] = [];
  formatos.forEach((f, i) => {
    if (isModeloCompraCpc(f.modeloCompra)) {
      indicesCpc.push(i);
    } else {
      indicesOutros.push(i);
    }
  });
  if (indicesCpc.length === 0) {
    return formatos;
  }

  const somaCpc = indicesCpc.reduce((acc, i) => acc + formatos[i].percentual, 0);
  if (somaCpc <= teto) {
    return formatos;
  }

  const result = formatos.map((f) => ({ ...f }));
  const fator = teto / somaCpc;
  for (const i of indicesCpc) {
    result[i].percentual *= fator;
  }

  const somaAtual = result.reduce((acc, f) => acc + f.percentual, 0);
  const aRedistribuir = 100 - somaAtual;
  const somaOutros = indicesOutros.reduce((acc, i) => acc + result[i].percentual, 0);

  if (aRedistribuir > 0 && somaOutros > 0) {
    for (const i of indicesOutros) {
      result[i].percentual += (result[i].percentual / somaOutros) * aRedistribuir;
    }
  } else if (aRedistribuir > 0 && indicesOutros.length > 0) {
    const parcela = aRedistribuir / indicesOutros.length;
    for (const i of indicesOutros) {
      result[i].percentual += parcela;
    }
  }

  const somaFinal = result.reduce((acc, f) => acc + f.percentual, 0);
  if (somaFinal > 0 && Math.abs(somaFinal - 100) > 0.01) {
    return result.map((f) => ({ ...f, percentual: (f.percentual / somaFinal) * 100 }));
  }
  return result;
}

function obterDirecionalCpcPorObjetivo(objetivo: string): string {
  const chave = normalizarObjetivo(objetivo);
  if (chave === 'leads' || chave === 'vendas') {
    return (
      'Se houver formatos com modelo CPC na seleção, a soma de % destinada a eles deve ser no máximo 10% do budget. ' +
      'Em leads/vendas a plataforma otimiza para CPL/CPA/vendas — CPC/CTR não deve dominar o plano.'
    );
  }
  if (chave === 'consideracao') {
    return (
      'Se houver formatos CPC na seleção, até 40% do budget pode ir para eles (tráfego/consideração). ' +
      'Acima disso, priorize CPM/CPV nas demais linhas.'
    );
  }
  return '';
}

/**
 * Gera mix de mídia usando IA
 */
export async function gerarMixMidia(
  parametros: ParametrosMediaPlanner
): Promise<RespostaMediaPlanner> {
  const prompt = construirPromptMediaPlanner(parametros);
  const mixReferencia = obterMixReferenciaPorObjetivo(parametros.objetivo);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Você é um planejador de mídia da Weach, especialista em campanhas digitais multicanal.
          
REGRAS OBRIGATÓRIAS:
- Use SOMENTE os inventários fornecidos em inventarios_disponiveis
- A soma dos percentuais de budget deve ser exatamente 100
- Não invente canais fora da lista fornecida
- Não sugira valores financeiros em reais, apenas percentuais
- Retorne a resposta em JSON válido

MIX DE REFERÊNCIA POR OBJETIVO (use como direcional; ajuste só se o briefing exigir e respeitando inventários disponíveis):
- awareness: ${formatarMixReferenciaTexto(MIX_REFERENCIA_POR_OBJETIVO.awareness)}
- leads / vendas: ${formatarMixReferenciaTexto(MIX_REFERENCIA_POR_OBJETIVO.leads)}
- consideracao: ${formatarMixReferenciaTexto(MIX_REFERENCIA_POR_OBJETIVO.consideracao)}

Para o objetivo desta campanha, referência: ${formatarMixReferenciaTexto(mixReferencia)}.
${obterDirecionalCpcPorObjetivo(parametros.objetivo)}

FORMATO DE RESPOSTA:
{
  "mix": [
    { "canal": "display_programatico", "percentual": 40 },
    { "canal": "video_programatico", "percentual": 30 }
  ],
  "racional": "Texto explicativo de 2-4 parágrafos"
}`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const conteudo = response.choices[0]?.message?.content;
    if (!conteudo) {
      throw new Error('Resposta vazia da IA');
    }

    const resultado = JSON.parse(conteudo) as RespostaMediaPlanner;

    // Validação: soma deve ser 100
    const soma = resultado.mix.reduce((acc, item) => acc + item.percentual, 0);
    if (Math.abs(soma - 100) > 0.01) {
      // Normaliza para 100
      resultado.mix = resultado.mix.map(item => ({
        ...item,
        percentual: (item.percentual / soma) * 100,
      }));
    }

    return { ...resultado, origemMix: 'ia' };
  } catch (error) {
    console.error('Erro ao gerar mix de mídia:', error);
    return { ...gerarMixPadrao(parametros), origemMix: 'fallback_padrao' };
  }
}

/**
 * Constrói prompt para o Media Planner
 */
function construirPromptMediaPlanner(parametros: ParametrosMediaPlanner): string {
  return `Gere um plano de mídia para a seguinte campanha:

SEGMENTO: ${parametros.segmento}
OBJETIVO: ${parametros.objetivo}
BUDGET TOTAL: R$ ${parametros.budgetTotal.toLocaleString('pt-BR')}
REGIÃO: ${parametros.regiao}
MATURIDADE DIGITAL: ${parametros.maturidadeDigital}
TOLERÂNCIA A RISCO: ${parametros.toleranciaRisco}

INVENTÁRIOS DISPONÍVEIS:
${parametros.inventariosDisponiveis.map(i => `- ${i}`).join('\n')}

${parametros.preferenciasCliente?.evitarCanais 
  ? `CANAIS A EVITAR: ${parametros.preferenciasCliente.evitarCanais.join(', ')}`
  : ''}
${parametros.preferenciasCliente?.preferirCanais 
  ? `CANAIS PREFERIDOS: ${parametros.preferenciasCliente.preferirCanais.join(', ')}`
  : ''}

ORIENTAÇÕES:
- Objetivo ${parametros.objetivo}: ${obterOrientacaoPorObjetivo(parametros.objetivo)}
- Maturidade ${parametros.maturidadeDigital}: ${obterOrientacaoPorMaturidade(parametros.maturidadeDigital)}
- Risco ${parametros.toleranciaRisco}: ${obterOrientacaoPorRisco(parametros.toleranciaRisco)}

Gere o mix de canais com percentuais de budget e um racional estratégico.`;
}

function obterOrientacaoPorObjetivo(objetivo: string): string {
  const mixRef = obterMixReferenciaPorObjetivo(objetivo);
  const base = `referência de mix por canal: ${formatarMixReferenciaTexto(mixRef)}`;
  const cpc = obterDirecionalCpcPorObjetivo(objetivo);
  const orientacoes: Record<string, string> = {
    awareness:
      `${base}. Priorize vídeo e CTV para alcance; display complementa frequência.`,
    leads: `${base}. Foco em conversão (CPL/lead); ${cpc}`,
    vendas: `${base}. Mesma lógica de leads: conversão acima de tráfego CPC. ${cpc}`,
    consideracao: `${base}. Display e social para nurturing; ${cpc}`,
  };
  const chave = normalizarObjetivo(objetivo);
  return orientacoes[chave] ?? `${base}. Distribua entre os inventários disponíveis.`;
}

function obterOrientacaoPorMaturidade(maturidade: string): string {
  const orientacoes: Record<string, string> = {
    baixa: 'evitar complexidade extrema, mix simples',
    media: 'mix moderado com alguns canais',
    alta: 'pode combinar mais canais e tactics',
  };
  return orientacoes[maturidade.toLowerCase()] ?? 'mix padrão';
}

function obterOrientacaoPorRisco(risco: string): string {
  const orientacoes: Record<string, string> = {
    baixa: 'mix mais conservador, menos experimentação',
    media: 'equilíbrio entre conservador e inovador',
    alta: 'pode alocar parte para canais mais novos ou agressivos',
  };
  return orientacoes[risco.toLowerCase()] ?? 'mix padrão';
}

/**
 * Gera mix padrão quando a IA falha
 */
function gerarMixPadrao(parametros: ParametrosMediaPlanner): RespostaMediaPlanner {
  const inventariosNorm = new Set(
    parametros.inventariosDisponiveis.map((c) => c.trim().toLowerCase())
  );

  let mix = obterMixReferenciaPorObjetivo(parametros.objetivo).filter((item) =>
    inventariosNorm.has(item.canal.toLowerCase())
  );

  const soma = mix.reduce((acc, item) => acc + item.percentual, 0);
  if (soma > 0) {
    mix = mix.map((item) => ({
      ...item,
      percentual: (item.percentual / soma) * 100,
    }));
  }

  return {
    mix,
    racional: `Mix gerado automaticamente (referência Weach para ${parametros.objetivo}): ${formatarMixReferenciaTexto(obterMixReferenciaPorObjetivo(parametros.objetivo))}. Segmento: ${parametros.segmento}.`,
    origemMix: 'fallback_padrao',
  };
}

// -----------------------------------------------------------------------------
// Task 1-16 — Distribuição de % budget por formato
//
// Estratégia de fallback (auditoria): se a resposta da IA for inválida (JSON
// inesperado, índice fora da lista, soma ≠ 100 após renormalizar canais) ou
// a chamada falhar, usamos `distribuicaoFormatosFallbackDeterministico`, que
// aplica pesos fixos por modelo de compra (ex.: CPV pesa mais em AWARENESS)
// e ajusta por objetivo da campanha; em seguida renormalizamos a soma para
// 100% apenas entre os formatos de entrada. Assim o plano nunca quebra e
// a distribuição continua tipicamente não uniforme.
// -----------------------------------------------------------------------------

const PESO_MODELO_COMPRA: Record<string, number> = {
  CPV: 1.25,
  CPM: 1.0,
  CPC: 1.1,
  CPL: 1.2,
  CPS: 1.0,
  CPA: 1.15,
  CPQL: 1.15,
  CPQL_BANT: 1.1,
  CPQL_ENGAJAMENTO: 1.05,
};

const MAX_FORMATOS_IA = 20;

/**
 * Gera alocação de % de budget por linha de formato (múltiplas linhas = não uniforme por padrão).
 */
export async function gerarDistribuicaoBudgetPorFormato(
  params: {
    segmento: string;
    objetivo: string;
    budgetTotal: number;
    formatos: FormatoPlanoEntrada[];
  }
): Promise<RespostaDistribuicaoFormato> {
  const { formatos } = params;
  if (formatos.length === 0) {
    return { formatos: [], origem: 'fallback_pesos' };
  }
  if (formatos.length === 1) {
    return { formatos: [{ ...formatos[0], percentual: 100 }], origem: 'fallback_pesos' };
  }
  if (formatos.length > MAX_FORMATOS_IA) {
    return { ...distribuicaoFormatosFallbackDeterministico(params), origem: 'fallback_pesos' };
  }

  const prompt = construirPromptDistribuicaoFormato(params);
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Você define percentuais de investimento POR FORMATO para campanhas Weach.

REGRAS:
- Soma dos percentuais = exatamente 100.
- Use cada índice 0,1,... exatamente uma vez.
- Não crie formatos novos. Responda apenas JSON válido.
- Siga a TABELA DE PESOS do usuário (família + escala 1–5): formatos com peso 4–5 recebem mais budget; peso 1–2 recebem menos.
- Em LEADS/VENDAS: priorize conversão rastreável (Lead Ad, CPL, CRM). CTV quase não converte lead — máximo ~5% somando todas as linhas CTV. Lead Ad > Social Tráfego.
- Não justifique CTV alto em campanha de lead só por "alcance".

{
  "alocacoes": [ { "indice": 0, "percentual": 40 }, ... ],
  "racional": "Texto curto (2-4 frases) justificando a alocação."
}`,
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const conteudo = response.choices[0]?.message?.content;
    if (!conteudo) {
      return { ...distribuicaoFormatosFallbackDeterministico(params), origem: 'fallback_pesos' };
    }

    const bruto = JSON.parse(conteudo) as {
      alocacoes?: Array<{ indice?: number; percentual?: number }>;
      racional?: string;
    };

    const n = formatos.length;
    const vistos = new Set<number>();
    const pares: Array<{ indice: number; percentual: number }> = [];

    for (const a of bruto.alocacoes || []) {
      if (
        typeof a.indice !== 'number' ||
        a.indice < 0 ||
        a.indice >= n ||
        vistos.has(a.indice) ||
        typeof a.percentual !== 'number' ||
        a.percentual < 0
      ) {
        return { ...distribuicaoFormatosFallbackDeterministico(params), origem: 'fallback_pesos' };
      }
      vistos.add(a.indice);
      pares.push({ indice: a.indice, percentual: a.percentual });
    }

    if (vistos.size !== n) {
      return { ...distribuicaoFormatosFallbackDeterministico(params), origem: 'fallback_pesos' };
    }

    let soma = pares.reduce((acc, p) => acc + p.percentual, 0);
    if (soma <= 0) {
      return { ...distribuicaoFormatosFallbackDeterministico(params), origem: 'fallback_pesos' };
    }
    pares.forEach((p) => { p.percentual = (p.percentual / soma) * 100; });

    const alocados: Array<FormatoPlanoEntrada & { percentual: number }> = pares
      .sort((a, b) => a.indice - b.indice)
      .map((p) => ({
        ...formatos[p.indice],
        percentual: p.percentual,
      }));

    return {
      formatos: aplicarRegraPesoDisplayMaiorQueGama(
        aplicarLimitesEstrategicosFormatos(
          aplicarTetoAgregadoCpc(alocados, params.objetivo),
          params.objetivo
        )
      ),
      origem: 'ia',
      racional: typeof bruto.racional === 'string' ? bruto.racional : undefined,
    };
  } catch (error) {
    console.error('Erro em gerarDistribuicaoBudgetPorFormato:', error);
    return { ...distribuicaoFormatosFallbackDeterministico(params), origem: 'fallback_pesos' };
  }
}

function construirPromptDistribuicaoFormato(params: {
  segmento: string;
  objetivo: string;
  budgetTotal: number;
  formatos: FormatoPlanoEntrada[];
}): string {
  const tabelaPesos = montarTabelaPesosFormatoPrompt(params.formatos, params.objetivo);
  return `Defina a distribuição de budget (%) para cada linha. A soma deve ser 100.

CAMPANHA: segmento ${params.segmento}, objetivo ${params.objetivo}, orçamento R$ ${params.budgetTotal.toLocaleString('pt-BR')}

${tabelaPesos}

REGRA DISPLAY: quando existir "CPM - Display e/ou Native" e "CPM - Gama DSP", Native deve ter % maior que Gama.
${obterDirecionalCpcPorObjetivo(params.objetivo) ? `REGRA CPC: ${obterDirecionalCpcPorObjetivo(params.objetivo)}` : ''}`;
}

function obterChavePesoModelo(modeloCompra: string): string {
  const modelo = modeloCompra.toUpperCase();
  if (PESO_MODELO_COMPRA[modelo] !== undefined) {
    return modelo;
  }
  const keys = Object.keys(PESO_MODELO_COMPRA).sort((a, b) => b.length - a.length);
  return keys.find((k) => modelo.startsWith(k)) || 'CPM';
}

/**
 * Ajusta o peso por objetivo, usando a família do modelo (chave) já resolvida.
 */
function multiplicadorObjetivoParaChavePeso(
  objetivo: string,
  chave: string
): number {
  const o = (objetivo || '').toUpperCase();
  const m = chave;
  if (o === 'AWARENESS') {
    if (m === 'CPV' || m === 'CPM') { return 1.2; }
    if (m === 'CPL' || m === 'CPS' || m === 'CPQL' || m.startsWith('CPQL_')) { return 0.88; }
    return 1.0;
  }
  if (o === 'CONSIDERACAO') {
    if (['CPM', 'CPC', 'CPV'].includes(m)) { return 1.1; }
    return 1.0;
  }
  if (o === 'LEADS') {
    if (m === 'CPC') { return 0.55; }
    if (
      m === 'CPL' || m === 'CPS' || m === 'CPA' || m === 'CPQL' ||
      m.startsWith('CPQL_') || m.startsWith('CPL_')
    ) { return 1.25; }
    return 0.9;
  }
  if (o === 'VENDAS') {
    if (m === 'CPC') { return 0.55; }
    if (m === 'CPL' || m === 'CPS' || m === 'CPQL' || m.startsWith('CPQL_')) {
      return 1.2;
    }
    return 0.95;
  }
  return 1.0;
}

function pesoHeuristicoModeloEObjetivo(
  objetivo: string,
  modeloCompra: string
): number {
  const chavePeso = obterChavePesoModelo(modeloCompra);
  const base = PESO_MODELO_COMPRA[chavePeso] ?? 1.0;
  return base * multiplicadorObjetivoParaChavePeso(objetivo, chavePeso);
}

function normalizarFormatoComparacao(formato: string): string {
  return String(formato || '').trim().toLowerCase();
}

/**
 * Regra comercial fixa:
 * "CPM - Display e/ou Native" precisa ter percentual maior que "CPM - Gama DSP".
 */
function aplicarRegraPesoDisplayMaiorQueGama(
  formatos: Array<FormatoPlanoEntrada & { percentual: number }>
): Array<FormatoPlanoEntrada & { percentual: number }> {
  const displayIndices = formatos
    .map((item, index) =>
      normalizarFormatoComparacao(item.formato) === FORMATO_CPM_DISPLAY_NATIVE ? index : -1
    )
    .filter((index) => index >= 0);
  const gamaIndices = formatos
    .map((item, index) =>
      normalizarFormatoComparacao(item.formato) === FORMATO_CPM_GAMA_DSP ? index : -1
    )
    .filter((index) => index >= 0);

  if (displayIndices.length === 0 || gamaIndices.length === 0) {
    return formatos;
  }

  const minDisplay = Math.min(...displayIndices.map((index) => formatos[index].percentual));
  const maxGama = Math.max(...gamaIndices.map((index) => formatos[index].percentual));
  const minimoDelta = 0.01;
  const ajusteNecessario = maxGama + minimoDelta - minDisplay;

  if (ajusteNecessario <= 0) {
    return formatos;
  }

  const result = formatos.map((item) => ({ ...item }));
  const totalGama = gamaIndices.reduce((acc, index) => acc + result[index].percentual, 0);
  if (totalGama <= 0) {
    return result;
  }

  for (const index of gamaIndices) {
    const proporcao = result[index].percentual / totalGama;
    result[index].percentual = Math.max(0, result[index].percentual - ajusteNecessario * proporcao);
  }
  const aumentoPorLinhaDisplay = ajusteNecessario / displayIndices.length;
  for (const index of displayIndices) {
    result[index].percentual += aumentoPorLinhaDisplay;
  }

  const soma = result.reduce((acc, item) => acc + item.percentual, 0);
  if (soma > 0) {
    return result.map((item) => ({ ...item, percentual: (item.percentual / soma) * 100 }));
  }
  return result;
}

function distribuicaoFormatosFallbackDeterministico(params: {
  objetivo: string;
  formatos: FormatoPlanoEntrada[];
}): RespostaDistribuicaoFormato {
  return {
    formatos: aplicarPesosENormalizar(params.formatos, params.objetivo),
    origem: 'fallback_pesos',
    racional:
      'Distribuição recalculada de forma determinística a partir de pesos por modelo de compra e objetivo (task 1-16 — fallback).',
  };
}

/**
 * Público para testes e reúso: mesma regra do comentário de auditoria do topo desta seção.
 */
export function aplicarPesosENormalizar(
  formatos: FormatoPlanoEntrada[],
  objetivo: string
): Array<FormatoPlanoEntrada & { percentual: number }> {
  if (formatos.length === 0) {
    return [];
  }
  if (formatos.length === 1) {
    return [{ ...formatos[0], percentual: 100 }];
  }

  const pesos = formatos.map((f, i) => pesoFormatoParaObjetivo(f, objetivo, i));
  const somaPesos = pesos.reduce((a, b) => a + b, 0);
  if (somaPesos <= 0) {
    return formatos.map((f) => ({
      ...f,
      percentual: 100 / formatos.length,
    }));
  }

  const distribuicaoBase = formatos.map((f, i) => ({
    ...f,
    percentual: (pesos[i] / somaPesos) * 100,
  }));
  return aplicarRegraPesoDisplayMaiorQueGama(
    aplicarLimitesEstrategicosFormatos(
      aplicarTetoAgregadoCpc(distribuicaoBase, objetivo),
      objetivo
    )
  );
}

