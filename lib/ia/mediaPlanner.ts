/**
 * Agente IA - Media Planner
 * 
 * Responsável por gerar mix de canais e distribuição de budget.
 * Baseado em: docs/prompts/prompt-gerador-de-plano.md
 */

import OpenAI from 'openai';

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

export interface RespostaMediaPlanner {
  mix: MixCanal[];
  racional: string;
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

/**
 * Gera mix de mídia usando IA
 */
export async function gerarMixMidia(
  parametros: ParametrosMediaPlanner
): Promise<RespostaMediaPlanner> {
  const prompt = construirPromptMediaPlanner(parametros);

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

    return resultado;
  } catch (error) {
    console.error('Erro ao gerar mix de mídia:', error);
    // Retorna mix padrão em caso de erro
    return gerarMixPadrao(parametros);
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
  const orientacoes: Record<string, string> = {
    awareness: 'mais peso em Display, Vídeo, CTV',
    leads: 'mais peso em Social, Display, produtos CPL, CRM media',
    vendas: 'priorizar canais com intenção mais alta e remarketing',
    consideracao: 'equilibrar awareness e performance',
  };
  return orientacoes[objetivo.toLowerCase()] ?? 'distribuição equilibrada';
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
  const objetivo = parametros.objetivo.toLowerCase();
  
  let mix: MixCanal[] = [];

  if (objetivo === 'awareness') {
    mix = [
      { canal: 'display_programatico', percentual: 40 },
      { canal: 'video_programatico', percentual: 30 },
      { canal: 'ctv', percentual: 20 },
      { canal: 'social_programatico', percentual: 10 },
    ];
  } else if (objetivo === 'leads') {
    mix = [
      { canal: 'social_programatico', percentual: 35 },
      { canal: 'display_programatico', percentual: 30 },
      { canal: 'cpl_cpi', percentual: 20 },
      { canal: 'crm_media', percentual: 15 },
    ];
  } else {
    // Mix equilibrado
    mix = [
      { canal: 'display_programatico', percentual: 35 },
      { canal: 'video_programatico', percentual: 25 },
      { canal: 'social_programatico', percentual: 25 },
      { canal: 'ctv', percentual: 15 },
    ];
  }

  // Filtra apenas canais disponíveis
  mix = mix.filter(item => parametros.inventariosDisponiveis.includes(item.canal));

  // Normaliza para 100%
  const soma = mix.reduce((acc, item) => acc + item.percentual, 0);
  mix = mix.map(item => ({
    ...item,
    percentual: (item.percentual / soma) * 100,
  }));

  return {
    mix,
    racional: `Mix gerado automaticamente baseado no objetivo ${parametros.objetivo} e segmento ${parametros.segmento}.`,
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
          content: `Você define percentuais de investimento POR FORMATO.
          REGRAS:
        - Soma dos percentuais = exatamente 100.
        - Use cada índice 0,1,... exatamente uma vez (um percentual por formato da lista do usuário).
        - Não crie formatos novos. Responda apenas JSON válido.
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
      formatos: alocados,
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
  const linhas = params.formatos.map(
    (f, i) =>
      `  [${i}] ${f.canal} | ${f.formato} | ${f.modeloCompra}`
  );
  return `Defina a distribuição de budget (%) para cada linha. A soma deve ser 100.

CAMPANHA: segmento ${params.segmento}, objetivo ${params.objetivo}, orçamento R$ ${params.budgetTotal.toLocaleString('pt-BR')}

FORMATOS (cada um deve receber um %):
${linhas.join('\n')}

Considere coerência entre objetivo, modelo de compra (CPM, CPV, CPL, etc.) e o tipo de mídia. Dê pesos DIFERENTES entre as linhas (evite 50/50 ou divisão igual) quando fizer sentido.`;
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
    if (
      m === 'CPL' || m === 'CPC' || m === 'CPS' || m === 'CPA' || m === 'CPQL' ||
      m.startsWith('CPQL_') || m.startsWith('CPL_')
    ) { return 1.25; }
    return 0.9;
  }
  if (o === 'VENDAS') {
    if (m === 'CPC' || m === 'CPL' || m === 'CPS' || m === 'CPQL' || m.startsWith('CPQL_')) {
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

  const pesos = formatos.map((f, i) => {
    const w = pesoHeuristicoModeloEObjetivo(objetivo, f.modeloCompra);
    // Quebra de empate determinística: ordem de entrada influencia c epsilon (nunca uniforme por empate puro)
    return w * (1 + (i + 1) * 0.0001);
  });
  const somaPesos = pesos.reduce((a, b) => a + b, 0);
  if (somaPesos <= 0) {
    return formatos.map((f) => ({
      ...f,
      percentual: 100 / formatos.length,
    }));
  }

  return formatos.map((f, i) => ({
    ...f,
    percentual: (pesos[i] / somaPesos) * 100,
  }));
}

