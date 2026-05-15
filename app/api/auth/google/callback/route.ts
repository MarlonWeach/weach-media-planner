/**
 * GET /api/auth/google/callback — OAuth Google: troca código, valida e emite JWT (PBI-10 / 10-1).
 */

import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { generateToken } from '@/lib/auth/session';
import {
  emailPossuiDominioPermitidoParaLogin,
} from '@/lib/auth/emailDomainAllowlist';
import { randomBytes } from 'crypto';
import {
  getRequestOrigin,
  googleOAuthAutoProvisionAtivo,
  googleOAuthEstaConfigurado,
  montarRedirectCallbackComToken,
  montarRedirectLoginComErroOAuth,
  obterRedirectUriCallbackGoogle,
  obterUserInfoGoogle,
  trocarCodigoPorTokens,
  GOOGLE_OAUTH_COOKIE_NAMES,
} from '@/lib/auth/googleOAuth';

function limparCookiesOAuth(res: NextResponse) {
  res.cookies.delete(GOOGLE_OAUTH_COOKIE_NAMES.state);
  res.cookies.delete(GOOGLE_OAUTH_COOKIE_NAMES.redirect);
}

export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request);
  if (!origin) {
    return NextResponse.json({ error: 'Origem inválida' }, { status: 400 });
  }

  const erroOAuth = request.nextUrl.searchParams.get('error');
  if (erroOAuth) {
    const res = NextResponse.redirect(montarRedirectLoginComErroOAuth(origin, 'cancelado'));
    limparCookiesOAuth(res);
    return res;
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret || !googleOAuthEstaConfigurado()) {
    return NextResponse.redirect(montarRedirectLoginComErroOAuth(origin, 'nao_configurado'));
  }

  const code = request.nextUrl.searchParams.get('code');
  const stateQuery = request.nextUrl.searchParams.get('state');
  const stateCookie = request.cookies.get(GOOGLE_OAUTH_COOKIE_NAMES.state)?.value;
  const redirectCookie = request.cookies.get(GOOGLE_OAUTH_COOKIE_NAMES.redirect)?.value;

  if (!code || !stateQuery || !stateCookie || stateQuery !== stateCookie) {
    const res = NextResponse.redirect(montarRedirectLoginComErroOAuth(origin, 'estado_invalido'));
    limparCookiesOAuth(res);
    return res;
  }

  const redirectUri = obterRedirectUriCallbackGoogle(request);

  try {
    const tokens = await trocarCodigoPorTokens({
      clientId,
      clientSecret,
      code,
      redirectUri,
    });

    const profile = await obterUserInfoGoogle(tokens.access_token);
    const emailBruto = profile.email?.trim().toLowerCase();

    if (!emailBruto || !profile.email_verified) {
      const res = NextResponse.redirect(montarRedirectLoginComErroOAuth(origin, 'email_nao_verificado'));
      limparCookiesOAuth(res);
      return res;
    }

    if (!emailPossuiDominioPermitidoParaLogin(emailBruto)) {
      const res = NextResponse.redirect(montarRedirectLoginComErroOAuth(origin, 'dominio'));
      limparCookiesOAuth(res);
      return res;
    }

    const nome =
      profile.name?.trim() ||
      emailBruto.split('@')[0] ||
      'Utilizador';

    let usuario = await prisma.wp_Usuario.findUnique({
      where: { email: emailBruto },
    });

    if (!usuario) {
      if (!googleOAuthAutoProvisionAtivo()) {
        const res = NextResponse.redirect(montarRedirectLoginComErroOAuth(origin, 'sem_cadastro'));
        limparCookiesOAuth(res);
        return res;
      }

      const senhaAleatoria = randomBytes(48).toString('hex');
      const senhaHash = await hashPassword(senhaAleatoria);

      usuario = await prisma.wp_Usuario.create({
        data: {
          nome,
          email: emailBruto,
          senhaHash,
          googleSub: profile.sub,
          senhaLocalConfigurada: false,
          role: Role.COMERCIAL,
          ativo: true,
        },
      });
    } else {
      if (!usuario.ativo) {
        const res = NextResponse.redirect(montarRedirectLoginComErroOAuth(origin, 'usuario_inativo'));
        limparCookiesOAuth(res);
        return res;
      }

      if (usuario.googleSub && usuario.googleSub !== profile.sub) {
        const res = NextResponse.redirect(
          montarRedirectLoginComErroOAuth(origin, 'google_vinculado_outro')
        );
        limparCookiesOAuth(res);
        return res;
      }

      if (!usuario.googleSub) {
        try {
          usuario = await prisma.wp_Usuario.update({
            where: { id: usuario.id },
            data: { googleSub: profile.sub },
          });
        } catch (e: unknown) {
          const prismaCode = (e as { code?: string })?.code;
          if (prismaCode === 'P2002') {
            const res = NextResponse.redirect(
              montarRedirectLoginComErroOAuth(origin, 'google_vinculado_outro')
            );
            limparCookiesOAuth(res);
            return res;
          }
          throw e;
        }
      }
    }

    const token = generateToken({
      userId: usuario.id,
      email: usuario.email,
      role: usuario.role,
    });

    const destino = montarRedirectCallbackComToken({
      origin,
      token,
      redirectPath: redirectCookie || '/dashboard',
    });

    const res = NextResponse.redirect(destino);
    limparCookiesOAuth(res);
    return res;
  } catch (error) {
    const err = error as Error & { googleOAuthCode?: string; code?: string };
    console.error('[google/callback]', err?.message || error, error);
    let codigoErro = 'troca_token';
    if (err?.googleOAuthCode === 'redirect_uri') {
      codigoErro = 'redirect_uri';
    } else if (err?.googleOAuthCode === 'grant_invalido') {
      codigoErro = 'grant_invalido';
    } else if (err?.code === 'P2022' || String(err?.message || '').includes('Unknown column')) {
      codigoErro = 'schema_desatualizado';
    }
    const res = NextResponse.redirect(montarRedirectLoginComErroOAuth(origin, codigoErro));
    limparCookiesOAuth(res);
    return res;
  }
}
