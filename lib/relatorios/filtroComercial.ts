import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Filtro por comercial: cotações podem ter solicitante no formulário ou apenas
 * o usuário vendedor (ex.: Daniel/Abílio com solicitanteId null).
 */
export async function montarClausulaFiltroComercial(
  solicitanteId: string
): Promise<Prisma.wp_CotacaoWhereInput> {
  const solicitante = await prisma.wp_Solicitante.findUnique({
    where: { id: solicitanteId },
    select: { id: true, nome: true, email: true },
  });

  if (!solicitante) {
    return { solicitanteId };
  }

  const usuariosVinculados = await prisma.wp_Usuario.findMany({
    where: {
      OR: [
        { email: { equals: solicitante.email, mode: 'insensitive' } },
        { nome: { equals: solicitante.nome, mode: 'insensitive' } },
      ],
    },
    select: { id: true },
  });

  const or: Prisma.wp_CotacaoWhereInput[] = [
    { solicitanteId: solicitante.id },
    { solicitanteNome: { equals: solicitante.nome, mode: 'insensitive' } },
  ];

  for (const usuario of usuariosVinculados) {
    or.push({ vendedorId: usuario.id });
  }

  return { OR: or };
}
