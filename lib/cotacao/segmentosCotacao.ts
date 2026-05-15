import { z } from 'zod';

/**
 * Segmentos de cliente no wizard e na API de cotação.
 * Manter alinhado ao enum `Segmento` em `prisma/schema.prisma`.
 */
const SEGMENTOS_WIZARD_BASE = [
  { value: 'AUTOMOTIVO', label: 'Automotivo' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
  { value: 'VAREJO', label: 'Varejo' },
  { value: 'IMOBILIARIO', label: 'Imobiliário' },
  { value: 'SAUDE', label: 'Saúde' },
  { value: 'EDUCACAO', label: 'Educação' },
  { value: 'TELECOM', label: 'Telecom' },
  { value: 'SERVICOS', label: 'Serviços' },
  { value: 'CPG_BENS_CONSUMO', label: 'CPG / Bens de consumo' },
  { value: 'PROMOCAO', label: 'Promoção' },
  { value: 'SAAS', label: 'SaaS' },
  { value: 'B2B', label: 'B2B' },
  { value: 'AGRO', label: 'Agro' },
  { value: 'TURISMO', label: 'Turismo' },
  { value: 'BELEZA_SAUDE', label: 'Beleza e saúde' },
  { value: 'OUTROS', label: 'Outros' },
] as const;

/** Opções do dropdown, ordenadas alfabeticamente pelo rótulo (pt-BR). */
export const SEGMENTOS_WIZARD = [...SEGMENTOS_WIZARD_BASE].sort((a, b) =>
  a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' })
);

export type SegmentoCotacaoValue = (typeof SEGMENTOS_WIZARD_BASE)[number]['value'];

const valoresSegmento = SEGMENTOS_WIZARD_BASE.map((item) => item.value) as unknown as [
  SegmentoCotacaoValue,
  SegmentoCotacaoValue,
  ...SegmentoCotacaoValue[],
];

/** Validação Zod explícita (evita depender só do `nativeEnum` com client Prisma em cache). */
export const zSegmentoCotacao = z.enum(valoresSegmento);
