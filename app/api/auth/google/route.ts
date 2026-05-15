/**
 * GET /api/auth/google — inicia fluxo OAuth Google (PBI-10 / 10-1).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  gerarEstadoOAuth,
  getRequestOrigin,
  getSafeOAuthRedirectPath,
  googleOAuthEstaConfigurado,
  montarUrlAutorizacaoGoogle,
  obterRedirectUriCallbackGoogle,
  GOOGLE_OAUTH_COOKIE_NAMES,
} from '@/lib/auth/googleOAuth';

const COOKIE_MAX_AGE = 60 * 10;

function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true as const,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  };
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret || !googleOAuthEstaConfigurado()) {
    return NextResponse.json(
      { success: false, error: 'Login Google não está configurado neste ambiente.' },
      { status: 503 }
    );
  }

  const origin = getRequestOrigin(request);
  if (!origin) {
    return NextResponse.json(
      { success: false, error: 'Não foi possível determinar a origem do pedido.' },
      { status: 400 }
    );
  }

  const redirectParam = request.nextUrl.searchParams.get('redirect');
  const redirectPath = getSafeOAuthRedirectPath(redirectParam);

  const state = gerarEstadoOAuth();
  const redirectUri = obterRedirectUriCallbackGoogle(request);
  const authUrl = montarUrlAutorizacaoGoogle({ clientId, redirectUri, state });

  const res = NextResponse.redirect(authUrl);
  const opts = cookieOptions();
  res.cookies.set(GOOGLE_OAUTH_COOKIE_NAMES.state, state, opts);
  res.cookies.set(GOOGLE_OAUTH_COOKIE_NAMES.redirect, redirectPath, opts);
  return res;
}
