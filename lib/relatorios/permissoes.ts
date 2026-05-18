import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/** Diretores (EXTERNO) e admin veem todas as cotações nos relatórios. */
export function veRelatoriosGlobais(role: Role): boolean {
  return role === Role.ADMIN || role === Role.EXTERNO;
}

export async function obterRoleUsuario(userId: string | null): Promise<Role | null> {
  if (!userId) return null;
  const u = await prisma.wp_Usuario.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return u?.role ?? null;
}

export async function podeAcessarRelatorios(userId: string | null): Promise<boolean> {
  const role = await obterRoleUsuario(userId);
  if (!role) return false;
  return role === Role.ADMIN || role === Role.EXTERNO || role === Role.COMERCIAL;
}

/** Admin e manager (EXTERNO) podem exportar Excel; comercial não, por enquanto. */
export function podeExportarRelatorio(role: Role): boolean {
  return role === Role.ADMIN || role === Role.EXTERNO;
}
