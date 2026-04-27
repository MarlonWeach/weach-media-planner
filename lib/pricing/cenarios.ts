/**
 * Cenários de Desconto por Budget
 * 
 * Aplica descontos progressivos baseados na faixa de budget total da campanha.
 */

export interface FaixaBudget {
  min: number;
  max: number | null; // null = sem limite máximo
  descontoPercentual: number;
}

/**
 * Cenários padrão de desconto por budget
 * Baseado em: docs/05-regras-de-negocio-pricing.md
 */
export const CENARIOS_BUDGET: FaixaBudget[] = [
  { min: 0, max: 10000, descontoPercentual: 0 },
  { min: 10000, max: 50000, descontoPercentual: 5 },
  { min: 50000, max: 100000, descontoPercentual: 10 },
  { min: 100000, max: null, descontoPercentual: 15 },
];

/**
 * Calcula o desconto percentual baseado no budget total
 */
export function calcularDescontoPorBudget(budget: number, cenarios: FaixaBudget[] = CENARIOS_BUDGET): number {
  for (const cenario of cenarios) {
    if (budget >= cenario.min && (cenario.max === null || budget < cenario.max)) {
      return cenario.descontoPercentual;
    }
  }
  
  // Se não encontrou nenhum cenário, retorna o maior desconto
  return cenarios[cenarios.length - 1]?.descontoPercentual ?? 0;
}

/**
 * Aplica desconto a um valor de preço
 */
export function aplicarDesconto(preco: number, descontoPercentual: number): number {
  return preco * (1 - descontoPercentual / 100);
}

/**
 * Aplica desconto baseado em budget a um objeto de preços
 */
export function aplicarDescontoPorBudget<T extends Record<string, number>>(
  precos: T,
  budget: number,
  cenarios: FaixaBudget[] = CENARIOS_BUDGET
): T {
  const desconto = calcularDescontoPorBudget(budget, cenarios);
  
  const precosComDesconto = {} as T;
  for (const [chave, valor] of Object.entries(precos)) {
    if (typeof valor === 'number') {
      precosComDesconto[chave as keyof T] = aplicarDesconto(valor, desconto) as T[keyof T];
    }
  }
  
  return precosComDesconto;
}

