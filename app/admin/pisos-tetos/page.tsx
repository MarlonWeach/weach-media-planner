'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

const canais = ['DISPLAY_PROGRAMATICO', 'VIDEO_PROGRAMATICO', 'CTV', 'AUDIO_DIGITAL', 'SOCIAL_PROGRAMATICO', 'CRM_MEDIA', 'IN_LIVE', 'CPL_CPI'] as const;
const segmentos = ['AUTOMOTIVO', 'FINANCEIRO', 'VAREJO', 'IMOBILIARIO', 'SAUDE', 'EDUCACAO', 'TELECOM', 'SERVICOS', 'OUTROS'] as const;
const regioes = ['NACIONAL', 'SP_CAPITAL', 'SUDESTE_EXCETO_SP', 'SUL', 'CENTRO_OESTE', 'NORDESTE', 'NORTE', 'CIDADES_MENORES'] as const;
const modelos = ['CPM', 'CPC', 'CPV', 'CPCL', 'CPL', 'CPI', 'CPD', 'PACOTE'] as const;
const canalLabels: Record<string, string> = {
  DISPLAY_PROGRAMATICO: 'Display Programático',
  VIDEO_PROGRAMATICO: 'Vídeo Programático',
  CTV: 'CTV',
  AUDIO_DIGITAL: 'Áudio Programático',
  SOCIAL_PROGRAMATICO: 'Social Programático',
  CRM_MEDIA: 'CRM Media',
  IN_LIVE: 'Geofence',
  CPL_CPI: 'CPL/CPI',
};

interface Regra {
  id: string;
  canal: string;
  segmento?: string | null;
  regiao?: string | null;
  formato?: string | null;
  modeloCompra: string;
  precoMin: number;
  precoAlvo: number;
  precoMax: number;
  ativo: boolean;
}

const initialForm = {
  canal: 'DISPLAY_PROGRAMATICO',
  segmento: '',
  regiao: '',
  formato: '',
  modeloCompra: 'CPM',
  precoMin: '',
  precoAlvo: '',
  precoMax: '',
};

export default function AdminPisosTetosPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regras, setRegras] = useState<Regra[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) router.push('/dashboard');
  }, [authLoading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) carregar();
  }, [isAdmin]);

  const authHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('auth_token');
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  };

  const carregar = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pisos-tetos', { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar regras');
      setRegras(data.regras || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar regras');
    } finally {
      setLoading(false);
    }
  };

  const salvar = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        canal: form.canal,
        segmento: form.segmento || undefined,
        regiao: form.regiao || undefined,
        formato: form.formato || undefined,
        modeloCompra: form.modeloCompra,
        precoMin: Number(form.precoMin),
        precoAlvo: Number(form.precoAlvo),
        precoMax: Number(form.precoMax),
      };
      if (!Number.isFinite(payload.precoMin) || !Number.isFinite(payload.precoAlvo) || !Number.isFinite(payload.precoMax)) {
        throw new Error('Preencha piso, alvo e teto com números válidos.');
      }
      const res = await fetch(editingId ? `/api/admin/pisos-tetos/${editingId}` : '/api/admin/pisos-tetos', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar regra');
      setSuccess(editingId ? 'Regra atualizada com sucesso.' : 'Regra criada com sucesso.');
      setEditingId(null);
      setForm(initialForm);
      await carregar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar regra');
    } finally {
      setSaving(false);
    }
  };

  const editar = (item: Regra) => {
    setEditingId(item.id);
    setForm({
      canal: item.canal,
      segmento: item.segmento || '',
      regiao: item.regiao || '',
      formato: item.formato || '',
      modeloCompra: item.modeloCompra,
      precoMin: String(item.precoMin),
      precoAlvo: String(item.precoAlvo),
      precoMax: String(item.precoMax),
    });
  };

  const alterarStatus = async (item: Regra) => {
    try {
      const res = await fetch(`/api/admin/pisos-tetos/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ ativo: !item.ativo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao alterar status');
      await carregar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar status');
    }
  };

  if (authLoading || loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Carregando...</div>;
  if (!isAuthenticated || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-dark mb-2">Pisos e Tetos</h1>
            <p className="text-gray-600">Gerencie limites de governança por canal/modelo/contexto.</p>
          </div>
          <button onClick={() => router.push('/admin')} className="px-4 py-2 text-gray-600 hover:text-gray-900">← Voltar</button>
        </div>

        {error && <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>}
        {success && <div className="p-3 rounded bg-green-50 text-green-700 border border-green-200">{success}</div>}

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold">{editingId ? 'Editar regra' : 'Nova regra'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select value={form.canal} onChange={(e) => setForm((p) => ({ ...p, canal: e.target.value }))} className="px-4 py-2 border rounded-lg">
              {canais.map((v) => <option key={v} value={v}>{canalLabels[v]}</option>)}
            </select>
            <select value={form.segmento} onChange={(e) => setForm((p) => ({ ...p, segmento: e.target.value }))} className="px-4 py-2 border rounded-lg">
              <option value="">(Sem segmento)</option>
              {segmentos.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={form.regiao} onChange={(e) => setForm((p) => ({ ...p, regiao: e.target.value }))} className="px-4 py-2 border rounded-lg">
              <option value="">(Sem região)</option>
              {regioes.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <input value={form.formato} onChange={(e) => setForm((p) => ({ ...p, formato: e.target.value }))} placeholder="Formato (opcional)" className="px-4 py-2 border rounded-lg" />
            <select value={form.modeloCompra} onChange={(e) => setForm((p) => ({ ...p, modeloCompra: e.target.value }))} className="px-4 py-2 border rounded-lg">
              {modelos.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <div />
            <input value={form.precoMin} onChange={(e) => setForm((p) => ({ ...p, precoMin: e.target.value }))} placeholder="Piso" type="number" step="0.0001" className="px-4 py-2 border rounded-lg" />
            <input value={form.precoAlvo} onChange={(e) => setForm((p) => ({ ...p, precoAlvo: e.target.value }))} placeholder="Alvo" type="number" step="0.0001" className="px-4 py-2 border rounded-lg" />
            <input value={form.precoMax} onChange={(e) => setForm((p) => ({ ...p, precoMax: e.target.value }))} placeholder="Teto" type="number" step="0.0001" className="px-4 py-2 border rounded-lg" />
          </div>
          <div className="flex gap-3">
            <button onClick={salvar} disabled={saving} className="px-6 py-2 bg-primary text-white rounded-lg">{saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Criar'}</button>
            {editingId && <button onClick={() => { setEditingId(null); setForm(initialForm); }} className="px-6 py-2 bg-gray-100 rounded-lg">Cancelar</button>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Regras cadastradas</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Canal</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Formato</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Segmento</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Região</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Modelo</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Piso</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Alvo</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Teto</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {regras.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-sm">{canalLabels[item.canal] || item.canal}</td>
                    <td className="px-3 py-2 text-sm">{item.formato || '-'}</td>
                    <td className="px-3 py-2 text-sm">{item.segmento || '-'}</td>
                    <td className="px-3 py-2 text-sm">{item.regiao || '-'}</td>
                    <td className="px-3 py-2 text-sm">{item.modeloCompra}</td>
                    <td className="px-3 py-2 text-sm">{item.precoMin.toFixed(4)}</td>
                    <td className="px-3 py-2 text-sm">{item.precoAlvo.toFixed(4)}</td>
                    <td className="px-3 py-2 text-sm">{item.precoMax.toFixed(4)}</td>
                    <td className="px-3 py-2 text-sm">{item.ativo ? 'Ativo' : 'Inativo'}</td>
                    <td className="px-3 py-2 text-sm space-x-2">
                      <button onClick={() => editar(item)} className="px-3 py-1 border rounded">Editar</button>
                      <button onClick={() => alterarStatus(item)} className="px-3 py-1 border rounded">{item.ativo ? 'Inativar' : 'Ativar'}</button>
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
