'use client';

/**
 * Recebe JWT no fragmento da URL após OAuth Google (evita enviar o token ao servidor).
 */

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function AuthCallbackInner() {
  const router = useRouter();
  const [mensagem, setMensagem] = useState('A concluir login…');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;

    if (!hash) {
      router.replace('/login?oauth_erro=oauth_invalido');
      return;
    }

    const params = new URLSearchParams(hash);
    const token = params.get('token');
    const redirect = params.get('redirect') || '/dashboard';

    if (!token) {
      router.replace('/login?oauth_erro=oauth_invalido');
      return;
    }

    try {
      localStorage.setItem('auth_token', token);
    } catch {
      setMensagem('Não foi possível guardar a sessão neste browser.');
      return;
    }

    window.history.replaceState(null, '', window.location.pathname);
    const destino = redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/dashboard';
    window.location.assign(destino);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center text-gray-600">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" />
        <p>{mensagem}</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
