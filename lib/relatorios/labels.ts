import type { Objetivo, Segmento, StatusCotacao } from '@prisma/client';
import { LABEL_ESCOPO_TAG, type EscopoTagId } from '@/lib/cotacao/tagsEscopoDashboard';

export const LABEL_SEGMENTO: Record<Segmento, string> = {
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

export const LABEL_OBJETIVO: Record<Objetivo, string> = {
  AWARENESS: 'Awareness',
  CONSIDERACAO: 'Consideração',
  LEADS: 'Leads',
  VENDAS: 'Vendas',
};

export const LABEL_STATUS: Record<StatusCotacao, string> = {
  RASCUNHO: 'Rascunho',
  ENVIADA: 'Enviada',
  APROVADA: 'Aprovada',
  RECUSADA: 'Recusada',
  EM_EXECUCAO: 'Em execução',
  FINALIZADA: 'Finalizada',
  AGUARDANDO_APROVACAO: 'Aguardando aprovação',
};

export const LABEL_CANAL: Record<string, string> = {
  DISPLAY_PROGRAMATICO: 'Display',
  VIDEO_PROGRAMATICO: 'Vídeo',
  CTV: 'CTV',
  AUDIO_DIGITAL: 'Áudio',
  SOCIAL_PROGRAMATICO: 'Social',
  CRM_MEDIA: 'CRM / Mensageria',
  IN_LIVE: 'In Live',
  CPL_CPI: 'Performance (CPL/CPI)',
};

export function labelEscopo(id: EscopoTagId): string {
  return LABEL_ESCOPO_TAG[id];
}

export function labelCanal(canal: string): string {
  const k = canal.toUpperCase();
  return LABEL_CANAL[k] || canal.replaceAll('_', ' ');
}
