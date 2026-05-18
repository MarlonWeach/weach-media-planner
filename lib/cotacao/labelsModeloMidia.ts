/**
 * Rótulos legíveis para chaves de modelo/formato (e-mail, PDF, briefing).
 * Chaves técnicas do wizard → texto para operadores.
 */

import { LABEL_ESCOPO_TAG, type EscopoTagId } from '@/lib/cotacao/tagsEscopoDashboard';

const LABEL_MODELO_PROGRAMATICA: Record<string, string> = {
  CPM_DISPLAY_NATIVE: 'Display e Native (CPM)',
  CPC_DISPLAY_NATIVE: 'Display e Native (CPC)',
  CPM_GAMA_DSP: 'Gama DSP (Display CPM)',
  DISPLAY_CPM_RETARGETING: 'Display Retargeting (CPM)',
  CPV_15_VIDEO: 'Vídeo 15" (CPV)',
  CPV_30_VIDEO: 'Vídeo 30" (CPV)',
  YOUTUBE_BUMPER_6: 'YouTube Bumper 6" (CPV)',
  YOUTUBE_30_CPV: 'YouTube 30" (CPV)',
  CTV_OPEN: 'CTV Open (CPV)',
  CTV_FAST_SAMSUNG: 'CTV FAST Samsung (CPV)',
  CTV_FAST_GLOBO: 'CTV FAST Globo (CPV)',
  CTV_PHILIPS_AOC: 'CTV Philips/AOC (CPV)',
  HBO_MAX_CPCV_30: 'HBO / MAX CPCV 30"',
  NATIVE_DIFERENCIADO: 'Native Diferenciado (CPM)',
  FACEBOOK_INSTAGRAM_ENGAJAMENTO: 'Facebook / Instagram — Engajamento',
  FACEBOOK_INSTAGRAM_TRAFEGO: 'Facebook / Instagram — Tráfego',
  FACEBOOK_INSTAGRAM_LEAD_AD: 'Facebook / Instagram — Lead Ad',
  KWAI: 'Kwai (CPM)',
  SPOTIFY_LEADERBOARD: 'Spotify Leaderboard (CPM)',
  SPOTIFY_AUDIO: 'Spotify Audio (CPM)',
  DEEZER_AUDIO: 'Deezer Audio (CPM)',
  SPOTIFY_VIDEO: 'Spotify Vídeo (CPV)',
  DEEZER_VIDEO: 'Deezer Vídeo (CPV)',
  SPOTIFY_OVERLAY: 'Spotify Overlay (CPM)',
  DEEZER_DISPLAY: 'Deezer Display (CPM)',
  LINKEDIN_SPONSORED: 'LinkedIn Sponsored (CPM)',
  LINKEDIN_INMAIL: 'LinkedIn Inmail',
  TIKTOK: 'TikTok (CPM)',
  NETFLIX: 'Netflix (CPV)',
  DISNEY_PLUS: 'Disney+ (CPV)',
  DISPLAY_GEOFENCE_3KM: 'Display Geofence 3 km (CPM)',
  OUTRO: 'Outro (Programática)',
};

const LABEL_MODELO_PERFORMANCE: Record<string, string> = {
  CPL_LEAD: 'CPL — Lead',
  CPI_APP: 'CPI — Instalação de App',
  CLIQUE_DUPLO: 'Clique Duplo (CPC)',
  CPA: 'CPA',
  OUTRO: 'Outro (Performance)',
};

const LABEL_SERVICO_MENSAGERIA: Record<string, string> = {
  SMS_CPD: 'SMS (CPD)',
  WHATSAPP_CPD: 'WhatsApp (CPD)',
  PUSH_CPC: 'Push (CPC)',
};

const LABEL_DEFINICAO_CAMPANHA: Record<string, string> = {
  PERFORMANCE: LABEL_ESCOPO_TAG.PERFORMANCE,
  PROGRAMATICA: LABEL_ESCOPO_TAG.PROGRAMATICA,
  WHATSAPP_SMS_PUSH: LABEL_ESCOPO_TAG.MENSAGERIA,
};

const MAPA_UNIFICADO: Record<string, string> = {
  ...LABEL_MODELO_PROGRAMATICA,
  ...LABEL_MODELO_PERFORMANCE,
  ...LABEL_SERVICO_MENSAGERIA,
  ...LABEL_DEFINICAO_CAMPANHA,
};

function normalizarChave(chave: string): string {
  return String(chave || '').trim().toUpperCase();
}

/** Uma chave técnica → rótulo para e-mail/PDF. */
export function formatarChaveModeloMidia(chave: string): string {
  const k = normalizarChave(chave);
  if (!k) return '';
  if (MAPA_UNIFICADO[k]) return MAPA_UNIFICADO[k];
  return chave
    .trim()
    .replaceAll('_', ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Lista de chaves → texto separado (briefing, planilha). */
export function formatarListaModelosMidia(
  valores: unknown,
  separador = ', '
): string {
  if (!Array.isArray(valores) || valores.length === 0) return '';
  const partes = valores
    .map((item) => formatarChaveModeloMidia(String(item)))
    .filter((s) => s.length > 0);
  return partes.join(separador);
}

/** Definição de campanha (escopo) para exportação. */
export function formatarDefinicaoCampanha(valores: unknown): string {
  if (!Array.isArray(valores) || valores.length === 0) return '';
  return valores
    .map((item) => {
      const k = normalizarChave(String(item));
      if (k === 'WHATSAPP_SMS_PUSH') return LABEL_ESCOPO_TAG.MENSAGERIA;
      const escopo = k as EscopoTagId;
      if (escopo in LABEL_ESCOPO_TAG) return LABEL_ESCOPO_TAG[escopo];
      return formatarChaveModeloMidia(k);
    })
    .filter(Boolean)
    .join(', ');
}
