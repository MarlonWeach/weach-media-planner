/**
 * Preços base CRM — WhatsApp, SMS e Push (mensageria).
 * CPD = custo por disparo / enviado / impacto. Push = CPC (custo por clique).
 * Valores em R$; fonte comercial Weach (tabela negocial).
 */
export const PRECO_CRM_WHATSAPP_CPD = 0.34;
export const PRECO_CRM_SMS_CPD = 0.2;
export const PRECO_CRM_PUSH_CPC = 0.6;

export type ModeloCompraCrmMensageria = 'CPD' | 'CPC';

/** Identifica o serviço pelo texto do formato (ex.: "WhatsApp - CPD"). */
export function modeloCompraCrmPorFormato(formato: string | null | undefined): ModeloCompraCrmMensageria {
  const f = (formato || '').toLowerCase();
  if (f.includes('push')) return 'CPC';
  return 'CPD';
}

export function precoUnitarioCrmPorFormato(formato: string | null | undefined): number {
  const f = (formato || '').toLowerCase();
  if (f.includes('whatsapp')) return PRECO_CRM_WHATSAPP_CPD;
  if (f.includes('sms')) return PRECO_CRM_SMS_CPD;
  if (f.includes('push')) return PRECO_CRM_PUSH_CPC;
  return PRECO_CRM_WHATSAPP_CPD;
}
