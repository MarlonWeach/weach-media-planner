/**
 * Página: Admin - Edição CPM Base
 * 
 * Permite que administradores editem o CPM base programático
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/contexts/AuthContext';
import { FormField } from '@/components/cotacao/FormField';
import { AlertBox } from '@/components/cotacao/AlertBox';
import dayjs from 'dayjs';

const schemaCpmBase = z.object({
  valor: z.number().positive('CPM base deve ser maior que zero'),
});

type CpmBaseFormData = z.infer<typeof schemaCpmBase>;

interface HistoricoItem {
  id: string;
  valorAnterior: number;
  valorNovo: number;
  usuario: {
    nome: string;
    email: string;
  };
  createdAt: string;
  observacoes: string | null;
}

export default function AdminCpmBasePage() {
  const router = useRouter();
  const { usuario, isAuthenticated, loading: authLoading, isAdmin } = useAuth();
  const [cpmBase, setCpmBase] = useState<number>(4.0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CpmBaseFormData>({
    resolver: zodResolver(schemaCpmBase),
    defaultValues: {
      valor: 4.0,
    },
  });

  // Redireciona se não for admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isAdmin, authLoading, router]);

  // Carrega dados
  useEffect(() => {
    if (isAdmin) {
      carregarDados();
    }
  }, [isAdmin]);

  const carregarDados = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/cpm-base', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar dados');
      }

      const data = await response.json();
      setCpmBase(data.cpmBase);
      setHistorico(data.historico || []);
      reset({ valor: data.cpmBase });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CpmBaseFormData) => {
    if (!confirm(`Tem certeza que deseja alterar o CPM base de ${cpmBase} para ${data.valor}?\n\nEsta alteração afetará todos os cálculos de precificação do sistema.`)) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/cpm-base', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar CPM base');
      }

      const result = await response.json();
      setCpmBase(result.cpmBase);
      setSuccess('CPM base atualizado com sucesso!');
      
      // Recarrega histórico
      await carregarDados();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar CPM base');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null; // Será redirecionado
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary-dark mb-2">
                Configuração - CPM Base Programático
              </h1>
              <p className="text-gray-600">
                Edite o valor central (D3) que determina todos os preços do sistema
              </p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Voltar
            </button>
          </div>
        </div>

        {/* Alertas */}
        {error && (
          <AlertBox
            type="error"
            title="Erro"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {success && (
          <AlertBox
            type="success"
            title="Sucesso"
            message={success}
            onClose={() => setSuccess(null)}
          />
        )}

        {/* Formulário */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                ⚠️ Importante
              </h3>
              <p className="text-sm text-blue-800">
                O CPM Base Programático (D3) é o valor central que determina todos os preços do sistema.
                Alterar este valor afetará automaticamente:
              </p>
              <ul className="text-sm text-blue-800 mt-2 list-disc list-inside">
                <li>CPM de Display</li>
                <li>CPC, Gama e Retargeting</li>
                <li>CPV de Vídeo</li>
                <li>CPV de CTV</li>
                <li>Preços de Social (Facebook, LinkedIn)</li>
              </ul>
            </div>

            <FormField
              label="CPM Base Programático (D3)"
              name="valor"
              required
              error={errors.valor?.message}
              helpText="Valor em reais por mil impressões (R$/mil)"
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-500">R$</span>
                <input
                  type="number"
                  id="valor"
                  step="0.01"
                  min="0.01"
                  {...register('valor', { valueAsNumber: true })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="4.00"
                  disabled={saving}
                />
                <span className="text-gray-500">/mil impressões</span>
              </div>
            </FormField>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600">
                <strong>Valor atual:</strong> R$ {cpmBase.toFixed(2)} /mil impressões
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Salvando...' : 'Salvar Alteração'}
              </button>
              <button
                type="button"
                onClick={() => reset({ valor: cpmBase })}
                disabled={saving}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>

        {/* Histórico de Alterações */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Histórico de Alterações
          </h2>

          {historico.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhuma alteração registrada ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Anterior
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Novo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Observações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historico.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {item.usuario.nome}
                        <div className="text-xs text-gray-500">{item.usuario.email}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        R$ {item.valorAnterior.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-primary">
                        R$ {item.valorNovo.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {item.observacoes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

