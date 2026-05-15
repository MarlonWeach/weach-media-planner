/**
 * OAuth 2.0 Google — URLs, troca de código e utilitários (Task PBI-10 / 10-1).
 */

import { randomBytes } from 'crypto';

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO = 'https://www.googleapis.com/oauth2/v3/userinfo';

const COOKIE_STATE = 'wp_google_oauth_state';
const COOKIE_REDIRECT = 'wp_google_oauth_redirect';

export const GOOGLE_OAUTH_COOKIE_NAMES = {
  state: COOKIE_STATE,
  redirect: COOKIE_REDIRECT,
} as const;

export function googleOAuthEstaConfigurado(): boolean {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() && process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim()
  );
}

/** `true` (default): cria `wp_Usuario` COMERCIAL no primeiro login Google com e-mail permitido. `false`: só utilizadores já existentes. */
export function googleOAuthAutoProvisionAtivo(): boolean {
  const raw = process.env.GOOGLE_OAUTH_AUTO_PROVISION?.trim().toLowerCase();
  if (raw === 'false' || raw === '0' || raw === 'no') return false;
  return true;
}

export function getRequestOrigin(request: { headers: Headers }): string {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  if (!host) return '';
  let proto = request.headers.get('x-forwarded-proto');
  if (!proto) {
    const isLocal =
      host.startsWith('localhost') ||
      host.startsWith('127.0.0.1') ||
      host.startsWith('[::1]');
    proto = isLocal ? 'http' : 'https';
  }
  return `${proto}://${host}`;
}

export function buildGoogleCallbackUrl(origin: string): string {
  const base = origin.replace(/\/$/, '');
  return `${base}/api/auth/google/callback`;
}

/**
 * URI de callback enviada ao Google (authorize + token). Deve coincidir **exactamente**
 * com uma entrada em "URIs de redirecionamento autorizados" no Google Cloud Console.
 *
 * Preferir `GOOGLE_OAUTH_REDIRECT_URI` em dev/proxy se `Host` / `x-forwarded-*` divergirem
 * do URL que o browser usou (ex.: `localhost` vs `127.0.0.1`).
 */
export function obterRedirectUriCallbackGoogle(request: { headers: Headers }): string {
  const fixo = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim();
  if (fixo) {
    return fixo.replace(/\/$/, '');
  }
  const origin = getRequestOrigin(request);
  return buildGoogleCallbackUrl(origin);
}

export function getSafeOAuthRedirectPath(value: string | null | undefined): string {
  if (!value || typeof value !== 'string') return '/dashboard';
  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/dashboard';
  return trimmed;
}

export function gerarEstadoOAuth(): string {
  return randomBytes(32).toString('hex');
}

export function montarUrlAutorizacaoGoogle(params: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const url = new URL(GOOGLE_AUTH);
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', params.state);
  url.searchParams.set('prompt', 'select_account');
  url.searchParams.set('access_type', 'online');
  return url.toString();
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in?: number;
  token_type?: string;
  refresh_token?: string;
}

export async function trocarCodigoPorTokens(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    code: params.code,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const json = (await res.json()) as GoogleTokenResponse & { error?: string; error_description?: string };

  if (!res.ok) {
    const msg = json.error_description || json.error || res.statusText;
    const err = new Error(`Falha ao obter token Google: ${msg}`) as Error & {
      googleOAuthCode?: string;
    };
    if (json.error === 'redirect_uri_mismatch') {
      err.googleOAuthCode = 'redirect_uri';
    } else if (json.error === 'invalid_grant') {
      err.googleOAuthCode = 'grant_invalido';
    }
    throw err;
  }

  if (!json.access_token) {
    throw new Error('Resposta Google sem access_token');
  }

  return json;
}

export interface GoogleUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export async function obterUserInfoGoogle(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(GOOGLE_USERINFO, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const json = (await res.json()) as GoogleUserInfo;

  if (!res.ok || !json.sub) {
    throw new Error('Falha ao obter perfil Google');
  }

  return json;
}

export function montarRedirectLoginComErroOAuth(origin: string, codigo: string): string {
  const url = new URL('/login', origin);
  url.searchParams.set('oauth_erro', codigo);
  return url.toString();
}

export function montarRedirectCallbackComToken(params: {
  origin: string;
  token: string;
  redirectPath: string;
}): string {
  const url = new URL('/auth/callback', params.origin);
  const hash = new URLSearchParams();
  hash.set('token', params.token);
  hash.set('redirect', getSafeOAuthRedirectPath(params.redirectPath));
  url.hash = hash.toString();
  return url.toString();
}
