/**
 * Tipos compartilhados do sistema
 */

export type Role = 'ADMIN' | 'COMERCIAL' | 'EXTERNO';
export type Segmento = 'AUTOMOTIVO' | 'FINANCEIRO' | 'VAREJO' | 'IMOBILIARIO' | 'SAUDE' | 'EDUCACAO' | 'TELECOM' | 'SERVICOS' | 'OUTROS';
export type Objetivo = 'AWARENESS' | 'CONSIDERACAO' | 'LEADS' | 'VENDAS';
export type MaturidadeDigital = 'BAIXA' | 'MEDIA' | 'ALTA';
export type ToleranciaRisco = 'BAIXA' | 'MEDIA' | 'ALTA';
export type Regiao = 'NACIONAL' | 'SP_CAPITAL' | 'SUDESTE_EXCETO_SP' | 'SUL' | 'CENTRO_OESTE' | 'NORDESTE' | 'NORTE' | 'CIDADES_MENORES';
export type StatusCotacao = 'RASCUNHO' | 'ENVIADA' | 'APROVADA' | 'RECUSADA' | 'EM_EXECUCAO' | 'FINALIZADA' | 'AGUARDANDO_APROVACAO';
export type CanalInventario = 'DISPLAY_PROGRAMATICO' | 'VIDEO_PROGRAMATICO' | 'CTV' | 'AUDIO_DIGITAL' | 'SOCIAL_PROGRAMATICO' | 'CRM_MEDIA' | 'IN_LIVE' | 'CPL_CPI';
export type ModeloCompra = 'CPM' | 'CPC' | 'CPV' | 'CPCL' | 'CPL' | 'CPI' | 'CPD' | 'PACOTE';

export interface MixCanal {
  canal: string;
  percentual: number;
  justificativa?: string;
}

export interface Estimativas {
  impressoes: number;
  cliques: number;
  leads: number;
  cpmEstimado: number;
  cpcEstimado: number;
  cplEstimado: number;
}

