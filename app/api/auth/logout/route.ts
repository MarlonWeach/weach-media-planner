/**
 * API Route: Logout
 * POST /api/auth/logout
 * 
 * Nota: Com JWT stateless, o logout é feito no cliente removendo o token.
 * Este endpoint existe para consistência e pode ser usado para invalidar tokens
 * em um sistema com blacklist de tokens (futuro).
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Com JWT stateless, o logout é feito no cliente
  // Em produção, pode-se implementar uma blacklist de tokens aqui
  return NextResponse.json({
    success: true,
    message: 'Logout realizado com sucesso',
  });
}

