/**
 * Motor Determinístico de Precificação
 * 
 * Este módulo implementa todas as fórmulas de precificação baseadas no CPM base programático (D3).
 * Todas as fórmulas são determinísticas e não dependem de IA.
 * 
 * Baseado em: docs/06-tabelas-de-preco-base.md
 */

export interface PrecoDisplay {
  cpmBase: number;
  gama: number;
  nativeDiferenciado: number;
  retargetingCpm: number;
  cpcDisplay: number;
  spotifyLeaderboard: number;
  spotifyOverlay: number;
  deezerDisplay: number;
}

export interface PrecoVideo {
  cpvVideo15: number;
  cpvVideo30: number;
  cpvYoutubeBumper6: number;
  cpvYoutube30: number;
  cpvSpotifyVideo30: number;
  cpvDeezerVideo30: number;
}

export interface PrecoCTV {
  cpvCtv30Open: number;
  cpvGloboFast: number;
  cpvGloboPlay15: number;
  cpvSamsungFast: number;
  cpvPhilipsAoc: number;
  cpvMaxNetflixDisney: number;
}

export interface PrecoAudio {
  spotifyAudioCpm: number;
  spotifyCpcl: number;
  deezerAudioCpm: number;
  deezerCpcl: number;
}

export interface PrecoSocial {
  linkedinSponsored: number;
  linkedinInmail: number;
  kwai: number;
  fbTrafego: number;
  fbEngajamento: number;
  fbLeadAd: number;
}

function arredondarParaCima2Casas(valor: number): number {
  return Math.ceil(valor * 100) / 100;
}

/**
 * Calcula preços de Display baseados no CPM base (D3)
 */
export function calcularPrecosDisplay(cpmBase: number, valoresFixos: {
  nativeDiferenciado?: number;
  retargetingCpm?: number;
  spotifyLeaderboard?: number;
  spotifyOverlay?: number;
  deezerDisplay?: number;
}): PrecoDisplay {
  return {
    cpmBase,
    gama: cpmBase + 1.75,
    nativeDiferenciado: valoresFixos.nativeDiferenciado ?? 28,
    retargetingCpm: valoresFixos.retargetingCpm ?? 15,
    cpcDisplay: cpmBase * 0.625,
    spotifyLeaderboard: valoresFixos.spotifyLeaderboard ?? 18,
    spotifyOverlay: valoresFixos.spotifyOverlay ?? 72,
    deezerDisplay: valoresFixos.deezerDisplay ?? 72,
  };
}

/**
 * Calcula preços de Vídeo baseados no CPM base (D3)
 */
export function calcularPrecosVideo(cpmBase: number, valoresFixos: {
  spotifyVideo30?: number;
  deezerVideo30?: number;
}): PrecoVideo {
  // CPV base vídeo 30" = D3 / 115
  const cpvVideo30 = arredondarParaCima2Casas(cpmBase / 115);
  const cpvVideo15 = arredondarParaCima2Casas(cpvVideo30 * 0.85);
  
  return {
    cpvVideo15,
    cpvVideo30,
    cpvYoutubeBumper6: cpvVideo15,
    cpvYoutube30: arredondarParaCima2Casas(cpvVideo30 * 2),
    cpvSpotifyVideo30: arredondarParaCima2Casas(valoresFixos.spotifyVideo30 ?? 0.25),
    cpvDeezerVideo30: arredondarParaCima2Casas(valoresFixos.deezerVideo30 ?? 0.25),
  };
}

/**
 * Calcula preços de CTV baseados no CPV vídeo 30" (E9)
 */
export function calcularPrecosCTV(cpvVideo30: number, cpmBase: number, valoresFixos?: {
  globoPlay15?: number;
  samsungFast?: number;
  philipsAoc?: number;
  maxNetflixDisney?: number;
}): PrecoCTV {
  // CTV 30" Open = CPV vídeo 30"
  const cpvCtv30Open = cpvVideo30;
  
  // Globo FAST - fórmula condicional baseada em D3
  const cpvGloboFast = calcularGloboFast(cpmBase);
  
  return {
    cpvCtv30Open,
    cpvGloboFast,
    cpvGloboPlay15: valoresFixos?.globoPlay15 ?? cpvVideo30 * 0.85,
    cpvSamsungFast: valoresFixos?.samsungFast ?? cpvGloboFast,
    cpvPhilipsAoc: valoresFixos?.philipsAoc ?? cpvGloboFast,
    cpvMaxNetflixDisney: valoresFixos?.maxNetflixDisney ?? cpvGloboFast * 1.2,
  };
}

/**
 * Calcula CPV Globo FAST baseado em CPM base (D3)
 * Fórmula condicional conforme planilha
 */
function calcularGloboFast(cpmBase: number): number {
  if (cpmBase === 4) return 0.17;
  if (cpmBase === 5) return 0.20;
  if (cpmBase === 7) return 0.20;
  if (cpmBase === 8) return 0.23;
  if (cpmBase === 9) return 0.25;
  
  // Interpolação linear para valores intermediários
  if (cpmBase < 4) return 0.17;
  if (cpmBase < 5) return 0.17 + (cpmBase - 4) * 0.03;
  if (cpmBase < 7) return 0.20;
  if (cpmBase < 8) return 0.20 + (cpmBase - 7) * 0.03;
  if (cpmBase < 9) return 0.23 + (cpmBase - 8) * 0.02;
  
  return 0.25;
}

/**
 * Calcula preços de Áudio baseados no CPV vídeo 30" (E9)
 */
export function calcularPrecosAudio(cpvVideo30: number, valoresFixos?: {
  spotifyAudio?: number;
  deezerAudio?: number;
}): PrecoAudio {
  return {
    spotifyAudioCpm: arredondarParaCima2Casas(valoresFixos?.spotifyAudio ?? 65),
    spotifyCpcl: arredondarParaCima2Casas(cpvVideo30 * 2),
    deezerAudioCpm: arredondarParaCima2Casas(valoresFixos?.deezerAudio ?? 64),
    deezerCpcl: arredondarParaCima2Casas(cpvVideo30 * 1.44),
  };
}

/**
 * Calcula preços de Social baseados no CPM base (D3)
 */
export function calcularPrecosSocial(cpmBase: number, valoresFixos?: {
  linkedinSponsored?: number;
  linkedinInmail?: number;
  kwai?: number;
  fbLeadAd?: number;
}): PrecoSocial {
  return {
    linkedinSponsored: valoresFixos?.linkedinSponsored ?? 90,
    linkedinInmail: valoresFixos?.linkedinInmail ?? 2.8,
    kwai: valoresFixos?.kwai ?? 9,
    fbTrafego: calcularFbTrafego(cpmBase),
    fbEngajamento: calcularFbEngajamento(cpmBase),
    fbLeadAd: valoresFixos?.fbLeadAd ?? 65,
  };
}

/**
 * Calcula FB Tráfego baseado em CPM base (D3)
 * Fórmula condicional conforme planilha
 */
function calcularFbTrafego(cpmBase: number): number {
  if (cpmBase === 4) return 10;
  if (cpmBase === 5) return 12;
  if (cpmBase === 7) return 12;
  if (cpmBase === 8) return 14;
  if (cpmBase === 9) return 16;
  
  // Interpolação linear
  if (cpmBase < 4) return 10;
  if (cpmBase < 5) return 10 + (cpmBase - 4) * 2;
  if (cpmBase < 7) return 12;
  if (cpmBase < 8) return 12 + (cpmBase - 7) * 2;
  if (cpmBase < 9) return 14 + (cpmBase - 8) * 2;
  
  return 16;
}

/**
 * Calcula FB Engajamento baseado em CPM base (D3)
 * Fórmula condicional conforme planilha
 */
function calcularFbEngajamento(cpmBase: number): number {
  if (cpmBase === 4) return 3;
  if (cpmBase === 5) return 4;
  if (cpmBase === 7) return 4;
  if (cpmBase === 8) return 4.5;
  if (cpmBase === 9) return 5;
  
  // Interpolação linear
  if (cpmBase < 4) return 3;
  if (cpmBase < 5) return 3 + (cpmBase - 4) * 1;
  if (cpmBase < 7) return 4;
  if (cpmBase < 8) return 4 + (cpmBase - 7) * 0.5;
  if (cpmBase < 9) return 4.5 + (cpmBase - 8) * 0.5;
  
  return 5;
}

/**
 * Calcula todos os preços programáticos baseados no CPM base (D3)
 */
export function calcularTodosPrecosProgramaticos(
  cpmBase: number,
  valoresFixos?: {
    display?: Partial<PrecoDisplay>;
    video?: Partial<PrecoVideo>;
    ctv?: Partial<PrecoCTV>;
    audio?: Partial<PrecoAudio>;
    social?: Partial<PrecoSocial>;
  }
) {
  const display = calcularPrecosDisplay(cpmBase, valoresFixos?.display ?? {});
  const videoFix = valoresFixos?.video;
  const video = calcularPrecosVideo(cpmBase, {
    spotifyVideo30: videoFix?.cpvSpotifyVideo30,
    deezerVideo30: videoFix?.cpvDeezerVideo30,
  });
  const ctvFix = valoresFixos?.ctv;
  const ctv = calcularPrecosCTV(video.cpvVideo30, cpmBase, {
    globoPlay15: ctvFix?.cpvGloboPlay15,
    samsungFast: ctvFix?.cpvSamsungFast,
    philipsAoc: ctvFix?.cpvPhilipsAoc,
    maxNetflixDisney: ctvFix?.cpvMaxNetflixDisney,
  });
  const audioFix = valoresFixos?.audio;
  const audio = calcularPrecosAudio(video.cpvVideo30, {
    spotifyAudio: audioFix?.spotifyAudioCpm,
    deezerAudio: audioFix?.deezerAudioCpm,
  });
  const socialFix = valoresFixos?.social;
  const social = calcularPrecosSocial(cpmBase, {
    linkedinSponsored: socialFix?.linkedinSponsored,
    linkedinInmail: socialFix?.linkedinInmail,
    kwai: socialFix?.kwai,
    fbLeadAd: socialFix?.fbLeadAd,
  });

  return {
    display,
    video,
    ctv,
    audio,
    social,
  };
}

