/**
 * Middleware de autenticação e autorização
 * 
 * Protege rotas baseado em autenticação e roles
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth/session';
import { Role } from '@prisma/client';

// Rotas públicas (não requerem autenticação)
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/register', // Se implementar registro
];

// Rotas que requerem role ADMIN
const adminRoutes = [
  '/api/admin',
];

// Rotas de API que requerem autenticação (mas qualquer role)
const protectedRoutes = [
  '/api/cotacao',
  '/api/pricing',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // A autenticação das APIs é feita nas próprias rotas (Authorization Bearer token).
  // Evita dupla validação no middleware e inconsistências no ambiente de desenvolvimento.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Verifica se é rota pública
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Verifica se é rota protegida
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAdminRoute = adminRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  // Verifica autenticação
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    // Se for rota de API, retorna 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Se for rota do frontend, redireciona para login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = verifyToken(token);

  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verifica role para rotas admin
  if (isAdminRoute && payload.role !== Role.ADMIN) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Adiciona headers com informações do usuário para uso nas rotas
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-email', payload.email);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
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

