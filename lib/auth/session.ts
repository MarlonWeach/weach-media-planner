/**
 * Gerenciamento de sessões e tokens JWT
 */

import jwt, { type SignOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
/** Duração do JWT (ex.: `1h`, `7d`). Produção pode alinhar à política de sessão. */
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as NonNullable<SignOptions['expiresIn']>;

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

/**
 * Gera token JWT para o usuário
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verifica e decodifica token JWT
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extrai token do header Authorization
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

