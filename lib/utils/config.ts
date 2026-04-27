/**
 * Configurações do sistema
 */

import { prisma } from '@/lib/prisma';

/**
 * Obtém CPM base programático (D3) do banco ou retorna padrão
 */
export async function obterCpmBase(): Promise<number> {
  try {
    const config = await prisma.wp_Configuracao.findUnique({
      where: { chave: 'CPM_BASE_PROGRAMATICO' },
    });

    if (config && typeof config.valor === 'object' && 'valor' in config.valor) {
      return Number((config.valor as any).valor) ?? 4;
    }

    return 4; // Valor padrão
  } catch (error) {
    console.error('Erro ao buscar CPM base:', error);
    return 4; // Valor padrão em caso de erro
  }
}

