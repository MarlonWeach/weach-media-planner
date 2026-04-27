/**
 * Regras de Governança de Preços
 * 
 * Implementa validações de piso, teto e margem mínima.
 * Baseado em: docs/05-regras-de-negocio-pricing.md e docs/rules/rules-pricing-governance.md
 */

export interface RegraGovernanca {
  precoMin: number;
  precoAlvo: number;
  precoMax: number;
  margemMinima: number;
}

export interface ResultadoValidacao {
  valido: boolean;
  erro?: string;
  aviso?: string;
  requerAprovacao?: boolean;
}

/**
 * Valida se um preço está dentro das regras de governança
 */
export function validarPreco(
  preco: number,
  regra: RegraGovernanca
): ResultadoValidacao {
  // Verifica se está abaixo do piso
  if (preco < regra.precoMin) {
    return {
      valido: false,
      erro: `Preço abaixo do mínimo permitido (R$ ${regra.precoMin.toFixed(2)})`,
    };
  }

  // Verifica se está acima do teto
  if (preco > regra.precoMax) {
    return {
      valido: false,
      erro: `Preço acima do máximo permitido (R$ ${regra.precoMax.toFixed(2)})`,
      requerAprovacao: true,
    };
  }

  // Verifica margem mínima
  // Assumindo que o preço alvo já inclui a margem mínima
  const margemAtual = calcularMargem(preco, regra.precoAlvo);
  
  if (margemAtual < regra.margemMinima) {
    return {
      valido: false,
      erro: `Margem mínima não atendida. Margem atual: ${margemAtual.toFixed(2)}%, mínima requerida: ${regra.margemMinima}%`,
      requerAprovacao: true,
    };
  }

  // Aviso se estiver próximo dos limites
  const percentualDoAlvo = (preco / regra.precoAlvo) * 100;
  
  if (percentualDoAlvo < 90) {
    return {
      valido: true,
      aviso: `Preço ${((100 - percentualDoAlvo).toFixed(1))}% abaixo do alvo recomendado`,
    };
  }

  if (percentualDoAlvo > 110) {
    return {
      valido: true,
      aviso: `Preço ${((percentualDoAlvo - 100).toFixed(1))}% acima do alvo recomendado`,
    };
  }

  return {
    valido: true,
  };
}

/**
 * Calcula margem percentual
 * Margem = ((preco - custo) / preco) * 100
 */
function calcularMargem(preco: number, custo: number): number {
  if (preco <= 0) return 0;
  return ((preco - custo) / preco) * 100;
}

/**
 * Aplica multiplicadores regionais
 * Baseado em: docs/05-regras-de-negocio-pricing.md
 */
export function aplicarMultiplicadorRegional(
  preco: number,
  regiao: string
): number {
  const multiplicadores: Record<string, number> = {
    SP_CAPITAL: 1.20,      // +20%
    SUDESTE_EXCETO_SP: 1.10, // +10%
    SUL: 1.0,              // neutro
    CENTRO_OESTE: 1.0,    // neutro
    NORDESTE: 0.90,        // -10%
    NORTE: 0.90,           // -10%
    CIDADES_MENORES: 0.85, // -15%
    NACIONAL: 1.0,         // neutro
  };

  const multiplicador = multiplicadores[regiao] ?? 1.0;
  return preco * multiplicador;
}

