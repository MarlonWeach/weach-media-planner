/**
 * Audit trail for how the plan was generated (PBI-9-13).
 * Reads from persisted `mixSugerido` JSON.
 */

export interface AuditoriaMotorCotacao {
  mixCanais: {
    origem: 'ia' | 'fallback_padrao' | null;
  };
  distribuicaoPorFormato: {
    origem: 'ia' | 'fallback_pesos' | null;
    racional: string | null;
  };
}

export function extrairAuditoriaMotorDeMixSugerido(
  mixSugerido: unknown
): AuditoriaMotorCotacao | null {
  if (!mixSugerido || typeof mixSugerido !== 'object' || Array.isArray(mixSugerido)) {
    return null;
  }
  const o = mixSugerido as Record<string, unknown>;
  const origemMix =
    o.origemMix === 'ia' || o.origemMix === 'fallback_padrao' ? o.origemMix : null;

  const dist = o.distribuicaoFormatos;
  let distribOrigem: 'ia' | 'fallback_pesos' | null = null;
  let racional: string | null = null;
  if (dist && typeof dist === 'object' && !Array.isArray(dist)) {
    const d = dist as Record<string, unknown>;
    if (d.origem === 'ia' || d.origem === 'fallback_pesos') {
      distribOrigem = d.origem;
    }
    if (typeof d.racional === 'string' && d.racional.trim()) {
      racional = d.racional.trim();
    }
  }

  if (!origemMix && !distribOrigem && !racional) {
    return null;
  }

  return {
    mixCanais: { origem: origemMix },
    distribuicaoPorFormato: {
      origem: distribOrigem,
      racional,
    },
  };
}
