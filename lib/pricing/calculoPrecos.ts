/**
 * Motor Principal de Cálculo de Preços
 * 
 * Orquestra todos os módulos de precificação para gerar preços finais
 * baseados em: segmento, região, objetivo, budget e outras variáveis.
 */

import { calcularTodosPrecosProgramaticos } from './formulasProgramaticas';
import { calcularDescontoPorBudget } from './cenarios';
import { validarPreco, RegraGovernanca } from './regrasGovernanca';
import { prisma } from '@/lib/prisma';

export interface ParametrosCalculo {
  cpmBase: number;
  segmento: string;
  regiao: string;
  budget: number;
  objetivo?: string;
  valoresFixos?: any;
}

export interface PrecosCalculados {
  display: any;
  video: any;
  ctv: any;
  audio: any;
  social: any;
  descontoAplicado: number;
  multiplicadorRegional: number;
}

export interface DiagnosticoPricing {
  valoresFixosMapeados: any;
  margensMinimasAtivas: Array<{
    id: string;
    canal: string;
    margemMinima: number;
    origem: string;
    ativo: boolean;
  }>;
  regrasAtivas: Array<{
    id: string;
    tipoRegra: string;
    canal: string;
    formato: string | null;
    modeloCompra: string;
    nomeRegra: string | null;
    valor: number;
    unidade: string;
    formula: string | null;
    ordem: number | null;
  }>;
}

/**
 * Calcula preços completos para uma cotação
 */
export async function calcularPrecosCotacao(
  parametros: ParametrosCalculo
): Promise<PrecosCalculados> {
  const valoresFixosBanco = await carregarValoresFixosPricing();
  const cpmBase = valoresFixosBanco.display?.cpmBase ?? parametros.cpmBase;

  // 2. Calcula preços base programáticos
  const precosBase = calcularTodosPrecosProgramaticos(
    cpmBase,
    mergeValoresFixos(parametros.valoresFixos, valoresFixosBanco)
  );

  // Task 1-15:
  // Para o resultado do plano no wizard, o usuário espera valores-base da tabela
  // (sem ajuste de desconto por budget e sem multiplicador regional).
  // Mantemos os campos de diagnóstico no retorno para evoluções futuras.
  const multiplicadorRegional = 1;
  const desconto = 0;
  const precosFinais = precosBase;

  return {
    ...precosFinais,
    descontoAplicado: desconto,
    multiplicadorRegional,
  };
}

function normalizarTexto(valor: string | null | undefined): string {
  if (!valor) return '';
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

async function carregarValoresFixosPricing() {
  const regras = await prisma.wp_ValorFixoPreco.findMany({
    where: { ativo: true },
    select: {
      canal: true,
      formato: true,
      nomeRegra: true,
      valor: true,
    },
  });

  const valoresFixos: any = {
    display: {},
    video: {},
    ctv: {},
    audio: {},
    social: {},
  };

  for (const regra of regras) {
    const formato = normalizarTexto(regra.formato);
    const nomeRegra = normalizarTexto(regra.nomeRegra);
    const valor = Number(regra.valor);

    if (regra.canal === 'DISPLAY_PROGRAMATICO') {
      if (formato.includes('cpm base') || nomeRegra.includes('cpm base')) valoresFixos.display.cpmBase = valor;
      if (formato.includes('native')) valoresFixos.display.nativeDiferenciado = valor;
      if (formato.includes('retargeting')) valoresFixos.display.retargetingCpm = valor;
      if (formato.includes('leader')) valoresFixos.display.spotifyLeaderboard = valor;
      if (formato.includes('overlay')) valoresFixos.display.spotifyOverlay = valor;
      if (formato.includes('deezer display')) valoresFixos.display.deezerDisplay = valor;
    }

    if (regra.canal === 'VIDEO_PROGRAMATICO') {
      if (formato.includes('spotify video')) valoresFixos.video.spotifyVideo30 = valor;
      if (formato.includes('deezer video')) valoresFixos.video.deezerVideo30 = valor;
    }

    if (regra.canal === 'CTV') {
      if (formato.includes('globoplay')) valoresFixos.ctv.globoPlay15 = valor;
      if (formato.includes('samsung')) valoresFixos.ctv.samsungFast = valor;
      if (formato.includes('philips') || formato.includes('aoc')) valoresFixos.ctv.philipsAoc = valor;
      if (formato.includes('max / netflix / disney')) valoresFixos.ctv.maxNetflixDisney = valor;
    }

    if (regra.canal === 'AUDIO_DIGITAL') {
      if (formato.includes('spotify audio')) valoresFixos.audio.spotifyAudio = valor;
      if (formato.includes('deezer audio')) valoresFixos.audio.deezerAudio = valor;
    }

    if (regra.canal === 'SOCIAL_PROGRAMATICO') {
      if (formato.includes('linkedin sponsored')) valoresFixos.social.linkedinSponsored = valor;
      if (formato.includes('linkedin inmail')) valoresFixos.social.linkedinInmail = valor;
      if (formato.includes('kwai')) valoresFixos.social.kwai = valor;
      if (formato.includes('fb lead ad')) valoresFixos.social.fbLeadAd = valor;
    }
  }

  return valoresFixos;
}

export async function obterDiagnosticoPricing(): Promise<DiagnosticoPricing> {
  const [valoresFixosMapeados, margensMinimasAtivas, regrasAtivas] = await Promise.all([
    carregarValoresFixosPricing(),
    buscarMargensMinimasAtivas(),
    prisma.wp_ValorFixoPreco.findMany({
      where: { ativo: true },
      orderBy: [{ canal: 'asc' }, { ordem: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        tipoRegra: true,
        canal: true,
        formato: true,
        modeloCompra: true,
        nomeRegra: true,
        valor: true,
        unidade: true,
        formula: true,
        ordem: true,
      },
    }),
  ]);

  type MargemRow = {
    id: string;
    canal: string;
    margemMinima: unknown;
    origem?: string | null;
    ativo: boolean;
  };

  return {
    valoresFixosMapeados,
    margensMinimasAtivas: (margensMinimasAtivas as MargemRow[]).map((item) => ({
      id: item.id,
      canal: item.canal,
      margemMinima: Number(item.margemMinima),
      origem: item.origem ?? '',
      ativo: item.ativo,
    })),
    regrasAtivas: regrasAtivas.map((item) => ({
      ...item,
      valor: Number(item.valor),
    })),
  };
}

function mergeValoresFixos(valoresFormulario: any, valoresBanco: any) {
  return {
    ...valoresBanco,
    ...valoresFormulario,
    display: { ...(valoresBanco?.display || {}), ...(valoresFormulario?.display || {}) },
    video: { ...(valoresBanco?.video || {}), ...(valoresFormulario?.video || {}) },
    ctv: { ...(valoresBanco?.ctv || {}), ...(valoresFormulario?.ctv || {}) },
    audio: { ...(valoresBanco?.audio || {}), ...(valoresFormulario?.audio || {}) },
    social: { ...(valoresBanco?.social || {}), ...(valoresFormulario?.social || {}) },
  };
}

/**
 * Obtém multiplicador regional
 */
function obterMultiplicadorRegional(regiao: string): number {
  const multiplicadores: Record<string, number> = {
    SP_CAPITAL: 1.20,
    SUDESTE_EXCETO_SP: 1.10,
    SUL: 1.0,
    CENTRO_OESTE: 1.0,
    NORDESTE: 0.90,
    NORTE: 0.90,
    CIDADES_MENORES: 0.85,
    NACIONAL: 1.0,
  };

  return multiplicadores[regiao] ?? 1.0;
}

/**
 * Aplica multiplicador regional a todos os preços
 */
function aplicarMultiplicadorRegionalAosPrecos(precos: any, multiplicador: number): any {
  const aplicar = (obj: any): any => {
    if (typeof obj === 'number') {
      return obj * multiplicador;
    }
    if (Array.isArray(obj)) {
      return obj.map(aplicar);
    }
    if (obj && typeof obj === 'object') {
      const resultado: any = {};
      for (const [chave, valor] of Object.entries(obj)) {
        resultado[chave] = aplicar(valor);
      }
      return resultado;
    }
    return obj;
  };

  return aplicar(precos);
}

/**
 * Aplica desconto a todos os preços
 */
function aplicarDescontoAosPrecos(precos: any, descontoPercentual: number): any {
  const aplicar = (obj: any): any => {
    if (typeof obj === 'number') {
      return obj * (1 - descontoPercentual / 100);
    }
    if (Array.isArray(obj)) {
      return obj.map(aplicar);
    }
    if (obj && typeof obj === 'object') {
      const resultado: any = {};
      for (const [chave, valor] of Object.entries(obj)) {
        resultado[chave] = aplicar(valor);
      }
      return resultado;
    }
    return obj;
  };

  return aplicar(precos);
}

/**
 * Valida preços contra regras de governança
 */
export async function validarPrecosContraRegras(
  precos: any,
  canal: string,
  segmento: string,
  regiao: string
): Promise<{ valido: boolean; erros: string[]; avisos: string[] }> {
  const erros: string[] = [];
  const avisos: string[] = [];

  // Busca regras de governança do banco
  const regras = await prisma.wp_PrecoBase.findMany({
    where: {
      canal: canal as any,
      segmento: segmento as any,
      regiao: regiao as any,
      ativo: true,
    },
  });

  const margemDelegate = (prisma as any).wp_MargemMinima;
  const margemConfigurada =
    margemDelegate && typeof margemDelegate.findFirst === 'function'
      ? await margemDelegate.findFirst({
          where: { canal: canal as any, ativo: true },
          select: { margemMinima: true },
        })
      : await prisma
          .$queryRawUnsafe<Array<{ margemMinima: number | string }>>(
            `SELECT "margemMinima" FROM "wp_MargemMinima" WHERE "canal" = $1::"CanalInventario" AND "ativo" = true LIMIT 1`,
            canal
          )
          .then((rows) => (rows[0] ? { margemMinima: rows[0].margemMinima as any } : null));
  const margemMinimaAplicada = margemConfigurada ? Number(margemConfigurada.margemMinima) : 20;

  // Valida cada preço encontrado
  for (const regra of regras) {
    const precoAtual = extrairPrecoDoCanal(precos, canal, regra.modeloCompra);
    
    if (precoAtual !== null) {
      const validacao = validarPreco(Number(precoAtual), {
        precoMin: Number(regra.precoMin),
        precoAlvo: Number(regra.precoAlvo),
        precoMax: Number(regra.precoMax),
        margemMinima: margemMinimaAplicada,
      });

      if (!validacao.valido && validacao.erro) {
        erros.push(validacao.erro);
      }
      if (validacao.aviso) {
        avisos.push(validacao.aviso);
      }
    }
  }

  return {
    valido: erros.length === 0,
    erros,
    avisos,
  };
}

async function buscarMargensMinimasAtivas() {
  const delegate = (prisma as any).wp_MargemMinima;
  if (delegate && typeof delegate.findMany === 'function') {
    return delegate.findMany({
      where: { ativo: true },
      orderBy: { canal: 'asc' },
      select: {
        id: true,
        canal: true,
        margemMinima: true,
        origem: true,
        ativo: true,
      },
    });
  }

  return prisma.$queryRawUnsafe<any[]>(
    `SELECT "id", "canal", "margemMinima", "origem", "ativo" FROM "wp_MargemMinima" WHERE "ativo" = true ORDER BY "canal" ASC`
  );
}

/**
 * Extrai preço de um canal específico
 */
function extrairPrecoDoCanal(precos: any, canal: string, modeloCompra: string): number | null {
  try {
    const mapaCanalParaChave: Record<string, string> = {
      DISPLAY_PROGRAMATICO: 'display',
      VIDEO_PROGRAMATICO: 'video',
      CTV: 'ctv',
      AUDIO_DIGITAL: 'audio',
      SOCIAL_PROGRAMATICO: 'social',
      CRM_MEDIA: 'crm',
      IN_LIVE: 'inLive',
      CPL_CPI: 'cplCpi',
    };

    const canalLower = (mapaCanalParaChave[canal] || canal).toLowerCase();
    const modeloLower = modeloCompra.toLowerCase();

    // Tenta encontrar o preço no objeto de preços
    if (precos[canalLower]) {
      const precosCanal = precos[canalLower];
      
      // Procura por propriedades que correspondam ao modelo de compra
      for (const [chave, valor] of Object.entries(precosCanal)) {
        if (chave.toLowerCase().includes(modeloLower) && typeof valor === 'number') {
          return valor;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

