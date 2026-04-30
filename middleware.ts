/**
 * Middleware leve para rotas Next.js.
 *
 * Nota: a autenticação/autorização é validada nas próprias API routes e no
 * fluxo de sessão do frontend. Mantemos este middleware "pass-through" para
 * evitar dependências Node.js no Edge Runtime (ex.: jsonwebtoken/prisma).
 */

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

