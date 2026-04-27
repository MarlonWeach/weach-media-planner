'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

type CanalInventario =
  | 'DISPLAY_PROGRAMATICO'
  | 'VIDEO_PROGRAMATICO'
  | 'CTV'
  | 'AUDIO_DIGITAL'
  | 'SOCIAL_PROGRAMATICO'
  | 'CRM_MEDIA'
  | 'IN_LIVE'
  | 'CPL_CPI';

interface MargemMinima {
  id: string;
  canal: CanalInventario;
  margemMinima: number;
  descricao?: string | null;
  origem: string;
  ativo: boolean;
}

const opcoesCanal: Array<{ value: CanalInventario; label: string }> = [
  { value: 'DISPLAY_PROGRAMATICO', label: 'Display Programático' },
  { value: 'VIDEO_PROGRAMATICO', label: 'Vídeo Programático' },
  { value: 'CTV', label: 'CTV' },
  { value: 'AUDIO_DIGITAL', label: 'Áudio Programático' },
  { value: 'SOCIAL_PROGRAMATICO', label: 'Social Programático' },
  { value: 'CRM_MEDIA', label: 'CRM Media' },
  { value: 'IN_LIVE', label: 'Geofence' },
  { value: 'CPL_CPI', label: 'CPL/CPI' },
];

const initialForm = {
  canal: 'DISPLAY_PROGRAMATICO' as CanalInventario,
  margemMinima: '',
  descricao: '',
};

export default function AdminMargensPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [margens, setMargens] = useState<MargemMinima[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) carregarMargens();
  }, [isAdmin]);

  const authHeaders = (): HeadersInit => {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const carregarMargens = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/margens', { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao carregar margens');
      setMargens(data.margens || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar margens');
    } finally {
      setLoading(false);
    }
  };

  const limparFormulario = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const preencherEdicao = (item: MargemMinima) => {
    setEditingId(item.id);
    setForm({
      canal: item.canal,
      margemMinima: String(item.margemMinima),
      descricao: item.descricao || '',
    });
  };

  const salvarMargem = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        canal: form.canal,
        margemMinima: Number(form.margemMinima),
        descricao: form.descricao || undefined,
      };

      if (!Number.isFinite(payload.margemMinima)) {
        throw new Error('Informe uma margem válida.');
      }

      const response = await fetch(
        editingId ? `/api/admin/margens/${editingId}` : '/api/admin/margens',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao salvar margem');

      setSuccess(editingId ? 'Margem mínima atualizada com sucesso.' : 'Margem mínima criada com sucesso.');
      limparFormulario();
      await carregarMargens();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar margem');
    } finally {
      setSaving(false);
    }
  };

  const alterarStatus = async (item: MargemMinima) => {
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/admin/margens/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ ativo: !item.ativo }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao alterar status');
      setSuccess('Status atualizado com sucesso.');
      await carregarMargens();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar status');
    }
  };

  const canalLabel = (canal: CanalInventario) =>
    opcoesCanal.find((item) => item.value === canal)?.label || canal;

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
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-dark mb-2">Margens Mínimas</h1>
            <p className="text-gray-600">Configure margem mínima (%) por canal para governança de pricing.</p>
          </div>
          <button onClick={() => router.push('/admin')} className="px-4 py-2 text-gray-600 hover:text-gray-900">
            ← Voltar
          </button>
        </div>

        {error && <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>}
        {success && <div className="p-3 rounded bg-green-50 text-green-700 border border-green-200">{success}</div>}

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold">{editingId ? 'Editar margem mínima' : 'Nova margem mínima'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Canal</label>
              <select
                disabled={Boolean(editingId)}
                value={form.canal}
                onChange={(e) => setForm((prev) => ({ ...prev, canal: e.target.value as CanalInventario }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
              >
                {opcoesCanal.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Margem Mínima (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.margemMinima}
                onChange={(e) => setForm((prev) => ({ ...prev, margemMinima: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
              <input
                type="text"
                value={form.descricao}
                onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={salvarMargem} disabled={saving} className="px-6 py-2 bg-primary text-white rounded-lg">
              {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Criar'}
            </button>
            {editingId && (
              <button onClick={limparFormulario} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg">
                Cancelar edição
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Margens cadastradas</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Canal</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Margem (%)</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {margens.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-sm">{canalLabel(item.canal)}</td>
                    <td className="px-3 py-2 text-sm">{item.margemMinima.toFixed(2)}%</td>
                    <td className="px-3 py-2 text-sm">{item.descricao || '-'}</td>
                    <td className="px-3 py-2 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          item.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {item.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm space-x-2">
                      <button onClick={() => preencherEdicao(item)} className="px-3 py-1 border border-gray-300 rounded">
                        Editar
                      </button>
                      <button onClick={() => alterarStatus(item)} className="px-3 py-1 border border-gray-300 rounded">
                        {item.ativo ? 'Inativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
