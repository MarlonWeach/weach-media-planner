/**
 * Página: Login
 * 
 * Tela de autenticação do sistema
 */

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/contexts/AuthContext';
import { FormField } from '@/components/cotacao/FormField';
import { TEXTO_DOMINIOS_PERMITIDOS_LOGIN } from '@/lib/auth/emailDomainAllowlist';

const MENSAGENS_ERRO_OAUTH: Record<string, string> = {
  cancelado: 'Login com Google foi cancelado. Pode tentar de novo ou usar e-mail e senha.',
  nao_configurado: 'Login com Google não está disponível neste ambiente.',
  estado_invalido: 'Sessão de login Google expirou ou é inválida. Inicie o processo novamente.',
  email_nao_verificado: 'O Google não confirmou o seu e-mail. Verifique a conta Google e tente novamente.',
  dominio: 'Apenas e-mails dos domínios autorizados podem aceder.',
  sem_cadastro:
    'Não existe utilizador com este e-mail. Peça a um administrador para criar a sua conta ou confirme as políticas de acesso.',
  usuario_inativo: 'Esta conta está inativa. Contacte um administrador.',
  google_vinculado_outro:
    'Esta conta já está associada a outro login Google. Use a mesma conta Google ou contacte um administrador.',
  troca_token: 'Não foi possível validar o login com Google. Tente novamente dentro de momentos.',
  redirect_uri:
    'O endereço de retorno OAuth não coincide com o configurado no Google Cloud. Use sempre o mesmo URL no browser (ex.: só `localhost` ou só `127.0.0.1`) ou defina `GOOGLE_OAUTH_REDIRECT_URI` no `.env` igual ao URI autorizado no console.',
  grant_invalido:
    'O código de autorização Google expirou ou já foi usado. Inicie o login novamente.',
  schema_desatualizado:
    'A base de dados local não tem a coluna necessária para o Google (ex.: `googleSub`). Execute `npx prisma db push` ou a migração correspondente e tente de novo.',
  oauth_invalido: 'Resposta de login Google inválida. Inicie o processo novamente.',
};

const schemaLogin = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

type LoginFormData = z.infer<typeof schemaLogin>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [avisoInatividade, setAvisoInatividade] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoginDisponivel, setGoogleLoginDisponivel] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(schemaLogin),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  // Redireciona se já estiver autenticado
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    }
  }, [isAuthenticated, authLoading, router, searchParams]);

  useEffect(() => {
    if (searchParams.get('motivo') === 'inatividade') {
      setAvisoInatividade(
        'Sua sessão foi encerrada após 1 hora sem atividade. Faça login novamente.'
      );
    }
  }, [searchParams]);

  useEffect(() => {
    const codigo = searchParams.get('oauth_erro');
    if (codigo) {
      setError(MENSAGENS_ERRO_OAUTH[codigo] ?? MENSAGENS_ERRO_OAUTH.oauth_invalido);
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelado = false;
    void (async () => {
      try {
        const res = await fetch('/api/auth/google/status');
        const data = (await res.json()) as { success?: boolean; enabled?: boolean };
        if (!cancelado && data.success && data.enabled) {
          setGoogleLoginDisponivel(true);
        }
      } catch {
        /* mantém botão oculto */
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await login(data.email, data.senha);

      if (result.success) {
        const redirect = searchParams.get('redirect') || '/dashboard';
        router.push(redirect);
      } else {
        setError(result.error || 'Erro ao fazer login');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  // Mostra loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se já estiver autenticado, não mostra o formulário (será redirecionado)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-dark mb-2">
            Weach
          </h1>
          <h2 className="text-2xl font-semibold text-gray-900">
            Pricing & Media Recommender
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Faça login para acessar o sistema
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Recomendamos o acesso com Google (conta corporativa no domínio permitido).
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {googleLoginDisponivel && (
            <div className="mb-6 space-y-4">
              <a
                href={`/api/auth/google?redirect=${encodeURIComponent(
                  searchParams.get('redirect') || '/dashboard'
                )}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50"
              >
                <svg className="h-5 w-5" aria-hidden viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar com Google
              </a>
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden>
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">ou e-mail e senha (alternativa)</span>
                </div>
              </div>
            </div>
          )}
          {!googleLoginDisponivel && (
            <p className="mb-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              O login com Google aparece aqui quando o ambiente estiver configurado. Até lá pode usar e-mail e senha.
            </p>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {avisoInatividade && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {avisoInatividade}
              </div>
            )}
            {/* Erro geral */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Email */}
            <FormField
              label="Email"
              name="email"
              required
              error={errors.email?.message}
            >
              <input
                type="email"
                id="email"
                {...register('email')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="nome@weachgroup.net"
                autoComplete="email"
                disabled={isLoading}
              />
            </FormField>
            <p className="-mt-2 text-xs text-gray-500">{TEXTO_DOMINIOS_PERMITIDOS_LOGIN}</p>

            {/* Senha */}
            <FormField
              label="Senha"
              name="senha"
              required
              error={errors.senha?.message}
            >
              <input
                type="password"
                id="senha"
                {...register('senha')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isLoading}
              />
            </FormField>

            {/* Botão Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Links adicionais (futuro) */}
          <div className="mt-6 text-center text-sm text-gray-600">
            {/* <a href="/recuperar-senha" className="text-primary hover:text-primary-dark">
              Esqueceu sua senha?
            </a> */}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Weach. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
