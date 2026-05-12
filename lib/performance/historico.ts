/** Canais do mix que entram na fila e no histórico de decisão de performance (não inclui mídia programática). */
export const CANAIS_MIX_PERFORMANCE_FILA = new Set(['CPL_CPI']);

export function ehCanalMixPerformanceFila(canal: string): boolean {
  return CANAIS_MIX_PERFORMANCE_FILA.has(String(canal || '').trim().toUpperCase());
}

export interface HistoricoPerformanceRegistro {
  canal: string;
  formato: string;
  modeloCompra: string;
  precoTabela: number;
  precoFinalAplicado: number;
  racionalTexto: string;
  racionalTags: string[];
  motivoAjustePreco: string;
  origemDecisao: 'MANUAL' | 'REVISAO' | 'EXCECAO';
  atualizadoEm: string;
  atualizadoPor: string;
}

export interface HistoricoPerformancePayload {
  versao: number;
  atualizadoEm: string;
  atualizadoPor: string;
  registros: HistoricoPerformanceRegistro[];
}

interface ObservacoesPayload {
  [key: string]: unknown;
  historicoPerformance?: HistoricoPerformancePayload;
}

function parseJsonSeguro(raw: string | null | undefined): ObservacoesPayload {
  if (!raw || typeof raw !== 'string') return {};
  try {
    const parsed = JSON.parse(raw) as ObservacoesPayload;
    if (parsed && typeof parsed === 'object') return parsed;
    return {};
  } catch {
    const trimmed = raw.trim();
    if (!trimmed) return {};
    return {
      solicitacao: {
        observacoesGerais: trimmed,
      },
    } as ObservacoesPayload;
  }
}

function normalizarNumero(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizarTexto(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function normalizarTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizarTexto(item))
    .filter((item) => item.length > 0);
}

function normalizarOrigemDecisao(value: unknown): 'MANUAL' | 'REVISAO' | 'EXCECAO' {
  const normalized = normalizarTexto(value).toUpperCase();
  if (normalized === 'REVISAO') return 'REVISAO';
  if (normalized === 'EXCECAO') return 'EXCECAO';
  return 'MANUAL';
}

function normalizarRegistro(raw: unknown): HistoricoPerformanceRegistro | null {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as Record<string, unknown>;
  const canal = normalizarTexto(source.canal);
  const formato = normalizarTexto(source.formato);
  const modeloCompra = normalizarTexto(source.modeloCompra);
  if (!canal || !formato || !modeloCompra) return null;

  return {
    canal,
    formato,
    modeloCompra,
    precoTabela: normalizarNumero(source.precoTabela),
    precoFinalAplicado: normalizarNumero(source.precoFinalAplicado),
    racionalTexto: normalizarTexto(source.racionalTexto),
    racionalTags: normalizarTags(source.racionalTags),
    motivoAjustePreco: normalizarTexto(source.motivoAjustePreco),
    origemDecisao: normalizarOrigemDecisao(source.origemDecisao),
    atualizadoEm:
      normalizarTexto(source.atualizadoEm) || new Date().toISOString(),
    atualizadoPor: normalizarTexto(source.atualizadoPor),
  };
}

export function extrairHistoricoPerformance(
  observacoes: string | null | undefined
): HistoricoPerformancePayload {
  const payload = parseJsonSeguro(observacoes);
  const historico = payload.historicoPerformance;
  if (!historico || typeof historico !== 'object') {
    return {
      versao: 1,
      atualizadoEm: '',
      atualizadoPor: '',
      registros: [],
    };
  }

  const registros = Array.isArray(historico.registros)
    ? historico.registros
        .map((item) => normalizarRegistro(item))
        .filter((item): item is HistoricoPerformanceRegistro => item !== null)
        .filter((item) => ehCanalMixPerformanceFila(item.canal))
    : [];

  return {
    versao: Number.isFinite(Number(historico.versao))
      ? Number(historico.versao)
      : 1,
    atualizadoEm: normalizarTexto(historico.atualizadoEm),
    atualizadoPor: normalizarTexto(historico.atualizadoPor),
    registros,
  };
}

function chaveRegistro(registro: Pick<HistoricoPerformanceRegistro, 'canal' | 'formato' | 'modeloCompra'>): string {
  return `${registro.canal}|||${registro.formato}|||${registro.modeloCompra}`;
}

export function atualizarObservacoesComHistoricoPerformance(params: {
  observacoesAtual: string | null | undefined;
  novoRegistro: HistoricoPerformanceRegistro;
  userId: string;
}): { observacoes: string; historico: HistoricoPerformancePayload; registroAnterior: HistoricoPerformanceRegistro | null } {
  const payload = parseJsonSeguro(params.observacoesAtual);
  const historicoAtual = extrairHistoricoPerformance(params.observacoesAtual);
  const key = chaveRegistro(params.novoRegistro);
  const registroAnterior =
    historicoAtual.registros.find((item) => chaveRegistro(item) === key) || null;

  const semAtual = historicoAtual.registros.filter(
    (item) => chaveRegistro(item) !== key
  );

  const novoHistorico: HistoricoPerformancePayload = {
    versao: (historicoAtual.versao || 1) + 1,
    atualizadoEm: new Date().toISOString(),
    atualizadoPor: params.userId,
    registros: [
      ...semAtual,
      {
        ...params.novoRegistro,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: params.userId,
      },
    ],
  };

  payload.historicoPerformance = novoHistorico;
  return {
    observacoes: JSON.stringify(payload, null, 2),
    historico: novoHistorico,
    registroAnterior,
  };
}

interface Step4MixItem {
  canal?: string;
  formato?: string;
  modeloCompra?: string;
  precoUnitario?: number;
  preco?: number;
}

export function sincronizarHistoricoComMixStep4(params: {
  observacoesAtual: string | null | undefined;
  mix: Step4MixItem[];
  userId: string;
}): string {
  const payload = parseJsonSeguro(params.observacoesAtual);
  const atual = extrairHistoricoPerformance(params.observacoesAtual);
  const mapaAtual = new Map(
    atual.registros.map((registro) => [chaveRegistro(registro), registro])
  );

  const registrosSincronizados = params.mix
    .filter((item) => ehCanalMixPerformanceFila(normalizarTexto(item.canal)))
    .map((item) => {
      const canal = normalizarTexto(item.canal);
      const formato = normalizarTexto(item.formato);
      const modeloCompra = normalizarTexto(item.modeloCompra);
      if (!canal || !formato || !modeloCompra) return null;

      const precoTabela = normalizarNumero(item.precoUnitario ?? item.preco);
      const base: HistoricoPerformanceRegistro = {
        canal,
        formato,
        modeloCompra,
        precoTabela,
        precoFinalAplicado: precoTabela,
        racionalTexto: '',
        racionalTags: [],
        motivoAjustePreco: '',
        origemDecisao: 'MANUAL',
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: params.userId,
      };
      const atualRegistro = mapaAtual.get(chaveRegistro(base));
      return atualRegistro
        ? {
            ...base,
            precoFinalAplicado: atualRegistro.precoFinalAplicado || precoTabela,
            racionalTexto: atualRegistro.racionalTexto,
            racionalTags: atualRegistro.racionalTags,
            motivoAjustePreco: atualRegistro.motivoAjustePreco,
            origemDecisao: atualRegistro.origemDecisao,
            atualizadoEm: atualRegistro.atualizadoEm,
            atualizadoPor: atualRegistro.atualizadoPor || params.userId,
          }
        : base;
    })
    .filter((item): item is HistoricoPerformanceRegistro => item !== null);

  payload.historicoPerformance = {
    versao: (atual.versao || 1) + 1,
    atualizadoEm: new Date().toISOString(),
    atualizadoPor: params.userId,
    registros: registrosSincronizados,
  };

  return JSON.stringify(payload, null, 2);
}

