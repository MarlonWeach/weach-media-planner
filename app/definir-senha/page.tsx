'use client';

import { FormEvent, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function DefinirSenhaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErro(null);
    setSucesso(null);
    setLoading(true);
    try {
      const response = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          senha,
          confirmarSenha,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao definir senha');
      }
      setSucesso('Senha criada com sucesso. Você já pode fazer login.');
      setTimeout(() => router.push('/login'), 1200);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao criar senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full max-w-md p-6 space-y-4">
        <h1 className="text-2xl font-bold text-primary-dark">Criar senha</h1>
        <p className="text-sm text-gray-600">
          Informe o seu e-mail e defina uma senha para acessar o sistema de cotações da Weach.
        </p>
        {!token && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Link inválido: token não encontrado.
          </div>
        )}
        {erro && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erro}</div>}
        {sucesso && (
          <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {sucesso}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Seu e-mail"
            required
          />
          <input
            type="password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Nova senha"
            minLength={8}
            required
          />
          <input
            type="password"
            value={confirmarSenha}
            onChange={(event) => setConfirmarSenha(event.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Confirmar senha"
            minLength={8}
            required
          />
          <button
            type="submit"
            disabled={!token || loading}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Definir senha'}
          </button>
        </form>
      </div>
    </div>
  );
}

