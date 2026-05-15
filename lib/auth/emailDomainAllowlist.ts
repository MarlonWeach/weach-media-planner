/**
 * Allowlist de domínios de e-mail para autenticação (PBI-10).
 *
 * Variáveis de ambiente:
 * - `AUTH_EMAIL_DOMAIN_ALLOWLIST`: lista separada por vírgulas (ex.: `weachgroup.net,insightmedia.com.br`).
 *   Se ausente ou vazia, usa os três domínios corporativos padrão.
 * - `AUTH_EMAIL_DOMAIN_CHECK_DISABLED=true`: desliga a checagem (apenas desenvolvimento local).
 */

const DOMINIOS_PADRAO = ['weachgroup.net', 'insightmedia.com.br', 'influlab.com.br'] as const;

export const TEXTO_DOMINIOS_PERMITIDOS_LOGIN =
  'Apenas contas @weachgroup.net, @insightmedia.com.br ou @influlab.com.br.';

/** Mensagem genérica na API (evita enumeração de conta existente vs domínio). */
export const MENSAGEM_EMAIL_DOMINIO_NEGADO =
  'Acesso não permitido para este e-mail. Use uma conta corporativa autorizada.';

export function dominiosEmailPermitidosAtivos(): string[] {
  if (process.env.AUTH_EMAIL_DOMAIN_CHECK_DISABLED === 'true') {
    return [];
  }
  const raw = process.env.AUTH_EMAIL_DOMAIN_ALLOWLIST?.trim();
  if (!raw) {
    return [...DOMINIOS_PADRAO];
  }
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * `true` se o e-mail pode autenticar-se (domínio permitido).
 * Quando a lista retornada por `dominiosEmailPermitidosAtivos()` está vazia por flag de dev, qualquer domínio é aceite.
 */
export function emailPossuiDominioPermitidoParaLogin(email: string): boolean {
  const dominios = dominiosEmailPermitidosAtivos();
  if (dominios.length === 0) {
    return true;
  }
  const normalizado = email.trim().toLowerCase();
  const arroba = normalizado.lastIndexOf('@');
  if (arroba < 0 || arroba === normalizado.length - 1) {
    return false;
  }
  const host = normalizado.slice(arroba + 1);
  return dominios.includes(host);
}
