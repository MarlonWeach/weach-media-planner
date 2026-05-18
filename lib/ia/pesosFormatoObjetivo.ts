/**
 * Pesos de distribuição % por formato, por família estratégica e objetivo.
 * Usado no fallback determinístico, no prompt da IA e em limites pós-alocação.
 */

export interface EntradaFormatoPeso {
  canal: string;
  formato: string;
  modeloCompra: string;
}

function normalizarObjetivo(objetivo: string): string {
  return (objetivo || '').trim().toLowerCase();
}

function isModeloCompraCpc(modeloCompra: string): boolean {
  const modelo = modeloCompra.toUpperCase();
  return modelo === 'CPC' || modelo.startsWith('CPC_');
}

export type FamiliaFormato =
  | 'lead_conversao'
  | 'display_principal'
  | 'display_gama'
  | 'display_cpc'
  | 'display_retargeting'
  | 'display_outros'
  | 'social_trafego'
  | 'social_engajamento'
  | 'social_outros'
  | 'ctv'
  | 'video'
  | 'audio'
  | 'crm_direto'
  | 'crm_push'
  | 'performance_cpl'
  | 'generico';

/** Peso relativo 0.2 (evitar) a 2.0 (prioridade máxima) por família × objetivo */
const PESO_FAMILIA_POR_OBJETIVO: Record<string, Partial<Record<FamiliaFormato, number>>> = {
  awareness: {
    ctv: 1.75,
    video: 1.65,
    display_principal: 1.35,
    display_gama: 1.1,
    display_outros: 1.05,
    audio: 1.2,
    social_outros: 1.0,
    social_trafego: 0.95,
    social_engajamento: 1.05,
    lead_conversao: 0.45,
    performance_cpl: 0.4,
    display_cpc: 0.7,
    crm_direto: 0.5,
    crm_push: 0.55,
    display_retargeting: 0.9,
    generico: 1.0,
  },
  consideracao: {
    display_principal: 1.5,
    display_retargeting: 1.35,
    display_gama: 1.15,
    social_trafego: 1.25,
    social_outros: 1.1,
    video: 1.05,
    display_cpc: 1.0,
    social_engajamento: 1.0,
    lead_conversao: 1.15,
    ctv: 0.75,
    audio: 0.85,
    performance_cpl: 1.1,
    crm_direto: 1.05,
    crm_push: 0.9,
    display_outros: 1.05,
    generico: 1.0,
  },
  leads: {
    lead_conversao: 1.9,
    performance_cpl: 1.75,
    crm_direto: 1.55,
    display_principal: 1.45,
    display_retargeting: 1.3,
    display_gama: 1.05,
    display_outros: 1.0,
    crm_push: 0.85,
    social_outros: 0.9,
    social_engajamento: 0.75,
    video: 0.35,
    display_cpc: 0.45,
    social_trafego: 0.6,
    audio: 0.5,
    ctv: 0.22,
    generico: 1.0,
  },
  vendas: {
    lead_conversao: 1.85,
    performance_cpl: 1.7,
    crm_direto: 1.5,
    display_principal: 1.4,
    display_retargeting: 1.35,
    display_gama: 1.0,
    display_outros: 1.0,
    crm_push: 0.85,
    social_outros: 0.88,
    social_engajamento: 0.72,
    video: 0.35,
    display_cpc: 0.45,
    social_trafego: 0.58,
    audio: 0.48,
    ctv: 0.2,
    generico: 1.0,
  },
};

/** Tetos agregados (% do budget) por família quando há linhas dessa família na seleção */
export const TETO_AGREGADO_FAMILIA: Partial<
  Record<string, Partial<Record<FamiliaFormato, number>>>
> = {
  leads: { ctv: 5, display_cpc: 10 },
  vendas: { ctv: 5, display_cpc: 10 },
  consideracao: { display_cpc: 40 },
};

/** Escala 1–5 para o prompt da IA (legível) */
const ESCALA_PROMPT: Array<{ min: number; label: string }> = [
  { min: 1.5, label: '5 — prioridade máxima' },
  { min: 1.25, label: '4 — alta' },
  { min: 1.0, label: '3 — média' },
  { min: 0.75, label: '2 — baixa' },
  { min: 0, label: '1 — evitar / mínimo' },
];

function normalizarTexto(s: string): string {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function classificarFamiliaFormato(
  entrada: EntradaFormatoPeso
): FamiliaFormato {
  const canal = normalizarTexto(entrada.canal);
  const formato = normalizarTexto(entrada.formato);
  const modelo = normalizarTexto(entrada.modeloCompra);

  if (
    formato.includes('lead ad') ||
    formato.includes('cpl - lead') ||
    modelo === 'cpl' ||
    modelo === 'cpa' ||
    modelo === 'cpi' ||
    (canal.includes('cpl') && (modelo === 'cpl' || modelo === 'cpi' || modelo === 'cpa'))
  ) {
    return 'lead_conversao';
  }

  if (formato.includes('trafego') || formato.includes('tráfego')) {
    return 'social_trafego';
  }
  if (formato.includes('engajamento') || modelo === 'cpe') {
    return 'social_engajamento';
  }

  if (canal === 'ctv' || formato.includes('ctv') || formato.includes('netflix') || formato.includes('disney')) {
    return 'ctv';
  }

  if (canal === 'video_programatico' || formato.includes('cpv') || formato.includes('youtube') || formato.includes('bumper')) {
    return 'video';
  }

  if (canal === 'audio_digital' || formato.includes('spotify audio') || formato.includes('deezer audio')) {
    return 'audio';
  }

  if (formato.includes('whatsapp') || formato.includes('sms')) {
    return 'crm_direto';
  }
  if (formato.includes('push')) {
    return 'crm_push';
  }

  if (canal === 'cpl_cpi' || canal.includes('cpl')) {
    return 'performance_cpl';
  }

  if (formato.includes('gama dsp')) {
    return 'display_gama';
  }
  if (formato.includes('cpm - display e/ou native') || formato.includes('cpm - display')) {
    return 'display_principal';
  }
  if (isModeloCompraCpc(entrada.modeloCompra) && (canal.includes('display') || formato.includes('cpc'))) {
    return 'display_cpc';
  }
  if (formato.includes('retargeting')) {
    return 'display_retargeting';
  }

  if (canal.includes('social')) {
    return 'social_outros';
  }
  if (canal.includes('display')) {
    return 'display_outros';
  }

  return 'generico';
}

export function obterPesoFamiliaObjetivo(familia: FamiliaFormato, objetivo: string): number {
  const chave = normalizarObjetivo(objetivo);
  const mapa = PESO_FAMILIA_POR_OBJETIVO[chave] ?? PESO_FAMILIA_POR_OBJETIVO.consideracao;
  return mapa?.[familia] ?? mapa?.generico ?? 1.0;
}

export function pesoFormatoParaObjetivo(
  entrada: EntradaFormatoPeso,
  objetivo: string,
  indice?: number
): number {
  const familia = classificarFamiliaFormato(entrada);
  const peso = obterPesoFamiliaObjetivo(familia, objetivo);
  const desempate = typeof indice === 'number' ? 1 + (indice + 1) * 0.0001 : 1;
  return peso * desempate;
}

export function pesoParaEscalaPrompt(peso: number): string {
  for (const faixa of ESCALA_PROMPT) {
    if (peso >= faixa.min) {
      return faixa.label;
    }
  }
  return '1 — evitar / mínimo';
}

export function montarTabelaPesosFormatoPrompt(
  formatos: EntradaFormatoPeso[],
  objetivo: string
): string {
  const chave = normalizarObjetivo(objetivo);
  const linhas = formatos.map((f, i) => {
    const familia = classificarFamiliaFormato(f);
    const peso = obterPesoFamiliaObjetivo(familia, objetivo);
    return `  [${i}] família=${familia} | peso_ref=${peso.toFixed(2)} (${pesoParaEscalaPrompt(peso)}) | ${f.canal} | ${f.formato} | ${f.modeloCompra}`;
  });

  const regras: string[] = [];
  if (chave === 'leads' || chave === 'vendas') {
    regras.push(
      '- Priorize formatos lead_conversao e performance_cpl (Lead Ad, CPL, CPA) — rastreio de conversão.',
      '- CTV: soma máxima 5% (mídia pouco clicável / difícil atribuir lead).',
      '- Social Lead Ad deve receber MAIS % que Social Tráfego quando ambos existirem.',
      '- CPC agregado máximo 10% (DSP otimiza clique, não lead).',
      '- Display CPM Native > Gama DSP quando ambos existirem.'
    );
  } else if (chave === 'awareness') {
    regras.push('- Priorize CTV, vídeo e display para alcance; evite peso alto em lead/CPL.');
  } else if (chave === 'consideracao') {
    regras.push('- Equilibre display, social tráfego e nurturing; CPC até 40% se presente.');
  }

  return `TABELA DE PESOS POR FORMATO (objetivo ${objetivo}) — siga como direcional forte:\n${linhas.join('\n')}\n\nREGRAS ESTRATÉGICAS:\n${regras.join('\n')}`;
}

function indicesPorFamilia(
  formatos: Array<EntradaFormatoPeso & { percentual: number }>
): Map<FamiliaFormato, number[]> {
  const mapa = new Map<FamiliaFormato, number[]>();
  formatos.forEach((f, i) => {
    const familia = classificarFamiliaFormato(f);
    const lista = mapa.get(familia) ?? [];
    lista.push(i);
    mapa.set(familia, lista);
  });
  return mapa;
}

function aplicarTetoFamilia(
  formatos: Array<EntradaFormatoPeso & { percentual: number }>,
  indices: number[],
  teto: number
): Array<EntradaFormatoPeso & { percentual: number }> {
  if (indices.length === 0) {
    return formatos;
  }
  const soma = indices.reduce((acc, i) => acc + formatos[i].percentual, 0);
  if (soma <= teto) {
    return formatos;
  }

  const result = formatos.map((f) => ({ ...f }));
  const fator = teto / soma;
  for (const i of indices) {
    result[i].percentual *= fator;
  }

  const excesso = soma - teto;
  const outros = result
    .map((_, i) => i)
    .filter((i) => !indices.includes(i));
  const somaOutros = outros.reduce((acc, i) => acc + result[i].percentual, 0);
  if (excesso > 0 && somaOutros > 0) {
    for (const i of outros) {
      result[i].percentual += (result[i].percentual / somaOutros) * excesso;
    }
  }

  const somaFinal = result.reduce((acc, f) => acc + f.percentual, 0);
  if (somaFinal > 0 && Math.abs(somaFinal - 100) > 0.01) {
    return result.map((f) => ({ ...f, percentual: (f.percentual / somaFinal) * 100 }));
  }
  return result;
}

/** Lead Ad (e afins) deve superar Social Tráfego em leads/vendas */
function aplicarPrioridadeLeadSobreTrafego(
  formatos: Array<EntradaFormatoPeso & { percentual: number }>,
  objetivo: string
): Array<EntradaFormatoPeso & { percentual: number }> {
  const chave = normalizarObjetivo(objetivo);
  if (chave !== 'leads' && chave !== 'vendas') {
    return formatos;
  }

  const porFamilia = indicesPorFamilia(formatos);
  const idxLead = porFamilia.get('lead_conversao') ?? [];
  const idxTrafego = porFamilia.get('social_trafego') ?? [];
  if (idxLead.length === 0 || idxTrafego.length === 0) {
    return formatos;
  }

  const somaLead = idxLead.reduce((acc, i) => acc + formatos[i].percentual, 0);
  const somaTrafego = idxTrafego.reduce((acc, i) => acc + formatos[i].percentual, 0);
  const minimoLead = somaTrafego * 1.5;
  if (somaLead >= minimoLead) {
    return formatos;
  }

  const deficit = minimoLead - somaLead;
  const result = formatos.map((f) => ({ ...f }));
  let restante = deficit;

  const fontes = [...idxTrafego, ...(porFamilia.get('ctv') ?? [])].filter(
    (i) => result[i].percentual > 0.5
  );
  const somaFontes = fontes.reduce((acc, i) => acc + result[i].percentual, 0);
  if (somaFontes <= 0) {
    return formatos;
  }

  for (const i of fontes) {
    const retirada = Math.min(result[i].percentual * 0.5, (result[i].percentual / somaFontes) * deficit);
    result[i].percentual -= retirada;
    restante -= retirada;
  }

  const addPorLinha = (deficit - restante) / idxLead.length;
  for (const i of idxLead) {
    result[i].percentual += addPorLinha;
  }

  const somaFinal = result.reduce((acc, f) => acc + f.percentual, 0);
  if (somaFinal > 0) {
    return result.map((f) => ({ ...f, percentual: (f.percentual / somaFinal) * 100 }));
  }
  return result;
}

/**
 * Limites pós-IA/fallback: tetos por família (CTV, CPC) e Lead Ad > Tráfego.
 */
export function aplicarLimitesEstrategicosFormatos(
  formatos: Array<EntradaFormatoPeso & { percentual: number }>,
  objetivo: string
): Array<EntradaFormatoPeso & { percentual: number }> {
  if (formatos.length === 0) {
    return formatos;
  }

  const chave = normalizarObjetivo(objetivo);
  const tetos = TETO_AGREGADO_FAMILIA[chave];
  let result = formatos.map((f) => ({ ...f }));

  if (tetos) {
    const porFamilia = indicesPorFamilia(result);
    for (const [familia, teto] of Object.entries(tetos) as Array<[FamiliaFormato, number]>) {
      const indices = porFamilia.get(familia);
      if (indices?.length) {
        result = aplicarTetoFamilia(result, indices, teto);
      }
    }
  }

  result = aplicarPrioridadeLeadSobreTrafego(result, objetivo);
  return result;
}
