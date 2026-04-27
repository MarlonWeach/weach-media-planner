/**
 * Utilitários de Autenticação
 */

import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth/session';

/**
 * Obtém ID do usuário do request via token JWT
 */
export function obterUserIdDoRequest(headers: Headers): string | null {
  // Tenta obter do token JWT primeiro
  const authHeader = headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);
  
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      return payload.userId;
    }
  }

  // Fallback para header x-user-id (compatibilidade)
  return headers.get('x-user-id');
}

/**
 * Obtém payload completo do token (incluindo role)
 */
export function obterUsuarioDoRequest(headers: Headers): {
  userId: string;
  email: string;
  role: Role;
} | null {
  const authHeader = headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);
  
  if (token) {
    return verifyToken(token);
  }

  return null;
}

/**
 * Verifica se usuário tem permissão para acessar uma cotação
 */
export async function podeAcessarCotacao(
  userId: string | null,
  cotacaoVendedorId: string
): Promise<boolean> {
  if (!userId) {
    return false;
  }

  const usuario = await prisma.wp_Usuario.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!usuario) {
    return false;
  }

  // Admin pode acessar todas as cotações
  if (usuario.role === 'ADMIN') {
    return true;
  }

  // Vendedor pode acessar apenas suas próprias cotações
  if (usuario.role === 'COMERCIAL') {
    return cotacaoVendedorId === userId;
  }

  return false;
}

/**
 * Verifica se usuário tem role específica
 */
export async function usuarioTemRole(
  userId: string | null,
  rolesPermitidos: Role[]
): Promise<boolean> {
  if (!userId) {
    return false;
  }

  const usuario = await prisma.wp_Usuario.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!usuario) {
    return false;
  }

  return rolesPermitidos.includes(usuario.role);
}

