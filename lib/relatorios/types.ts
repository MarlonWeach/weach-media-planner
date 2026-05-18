import type { Objetivo, Segmento, StatusCotacao } from '@prisma/client';

export interface FiltrosRelatorio {
  dataInicio?: Date;
  dataFim?: Date;
  /** Datas YYYY-MM-DD usadas no filtro (exibição; evita desvio UTC no label). */
  dataInicioLabel?: string;
  dataFimLabel?: string;
  segmento?: Segmento;
  solicitanteId?: string;
  status?: StatusCotacao;
}

export interface ResumoRelatorio {
  totalCotacoes: number;
  budgetTotal: number;
  ticketMedio: number;
}

export interface SeriePeriodo {
  periodo: string;
  label: string;
  quantidade: number;
  budget: number;
}

export interface ItemSegmento {
  segmento: string;
  label: string;
  quantidade: number;
  budget: number;
  percentualQuantidade: number;
}

export interface ItemStatus {
  status: StatusCotacao;
  label: string;
  quantidade: number;
  percentual: number;
}

export interface ItemVendedor {
  vendedorId: string;
  nome: string;
  quantidade: number;
  budget: number;
}

export interface ItemComercial {
  comercialId: string;
  nome: string;
  quantidade: number;
  budget: number;
}

export interface OpcaoFiltroRelatorio {
  id: string;
  nome: string;
}

export interface ItemObjetivo {
  objetivo: Objetivo;
  label: string;
  quantidade: number;
  budget: number;
}

export interface ItemEscopo {
  escopo: string;
  label: string;
  quantidade: number;
}

export interface MixCanalMedio {
  canal: string;
  label: string;
  percentualMedio: number;
  ocorrencias: number;
}

export interface DesvioPrecoItem {
  cotacaoId: string;
  clienteNome: string;
  canal: string;
  formato: string;
  precoTabela: number;
  precoFinal: number;
  desvioPercent: number;
}

export interface RelatorioComercialPayload {
  geradoEm: string;
  filtros: {
    dataInicio: string | null;
    dataFim: string | null;
    segmento: string | null;
    solicitanteId: string | null;
    escopoVisao: 'todas' | 'proprias';
  };
  opcoesFiltro?: {
    solicitantes: OpcaoFiltroRelatorio[];
  };
  resumo: ResumoRelatorio;
  porPeriodo: SeriePeriodo[];
  porSegmento: ItemSegmento[];
  porStatus: ItemStatus[];
  porVendedor: ItemVendedor[];
  porComercial: ItemComercial[];
  porObjetivo: ItemObjetivo[];
  porEscopo: ItemEscopo[];
  mixMedioPorCanal: MixCanalMedio[];
  desviosPrecoPerformance: DesvioPrecoItem[];
}
