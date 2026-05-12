export type DefinicaoCampanha = 'PERFORMANCE' | 'PROGRAMATICA' | 'WHATSAPP_SMS_PUSH';

export function extrairDefinicaoCampanhaDaObservacao(
  observacoes: string | null
): DefinicaoCampanha[] {
  if (!observacoes) return [];
  try {
    const parsed = JSON.parse(observacoes) as {
      estrategia?: { definicaoCampanha?: string[] };
    };
    const lista = parsed?.estrategia?.definicaoCampanha || [];
    return lista.filter(
      (item): item is DefinicaoCampanha =>
        item === 'PERFORMANCE' || item === 'PROGRAMATICA' || item === 'WHATSAPP_SMS_PUSH'
    );
  } catch {
    return [];
  }
}

export function inferirDefinicaoCampanhaPeloMix(mixSugerido: unknown): DefinicaoCampanha[] {
  const rows: Array<{ canal?: string }> = Array.isArray(mixSugerido)
    ? (mixSugerido as Array<{ canal?: string }>)
    : Array.isArray((mixSugerido as { mix?: Array<{ canal?: string }> } | null)?.mix)
      ? ((mixSugerido as { mix?: Array<{ canal?: string }> }).mix as Array<{ canal?: string }>)
      : [];

  const canais = new Set(
    rows
      .map((row) => (typeof row?.canal === 'string' ? row.canal.toUpperCase() : ''))
      .filter(Boolean)
  );

  const result = new Set<DefinicaoCampanha>();
  if (canais.has('CPL_CPI')) {
    result.add('PERFORMANCE');
  }
  if (
    canais.has('DISPLAY_PROGRAMATICO') ||
    canais.has('VIDEO_PROGRAMATICO') ||
    canais.has('CTV') ||
    canais.has('AUDIO_DIGITAL') ||
    canais.has('SOCIAL_PROGRAMATICO') ||
    canais.has('IN_LIVE')
  ) {
    result.add('PROGRAMATICA');
  }
  if (canais.has('CRM_MEDIA')) {
    result.add('WHATSAPP_SMS_PUSH');
  }

  return Array.from(result);
}

export function resolverApenasPerformance(
  observacoes: string | null,
  mixSugerido: unknown
): { definicaoCampanha: DefinicaoCampanha[]; apenasPerformance: boolean } {
  const definicaoDaObservacao = extrairDefinicaoCampanhaDaObservacao(observacoes);
  const definicaoCampanha =
    definicaoDaObservacao.length > 0
      ? definicaoDaObservacao
      : inferirDefinicaoCampanhaPeloMix(mixSugerido);
  const isPerformance = definicaoCampanha.includes('PERFORMANCE');
  const temProgramaticaOuMensageria =
    definicaoCampanha.includes('PROGRAMATICA') ||
    definicaoCampanha.includes('WHATSAPP_SMS_PUSH');
  const apenasPerformance = isPerformance && !temProgramaticaOuMensageria;
  return { definicaoCampanha, apenasPerformance };
}
