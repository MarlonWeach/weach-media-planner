'use client';

import { useEffect, useMemo, useState } from 'react';
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

type ModeloCompra = 'CPM' | 'CPC' | 'CPV' | 'CPCL' | 'CPL' | 'CPI' | 'CPD' | 'PACOTE';
type TipoRegra = 'FIXO' | 'CONDICIONAL';

interface RegraPreco {
  id: string;
  tipoRegra: TipoRegra;
  canal: CanalInventario;
  formato?: string | null;
  modeloCompra: ModeloCompra;
  nomeRegra?: string | null;
  valor: number;
  formula?: string | null;
  condicoes?: any;
  faixaMin?: number | null;
  faixaMax?: number | null;
  unidade: string;
  origem: string;
  ordem?: number | null;
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

const opcoesModeloCompra: ModeloCompra[] = ['CPM', 'CPC', 'CPV', 'CPCL', 'CPL', 'CPI', 'CPD', 'PACOTE'];

const initialForm = {
  tipoRegra: 'FIXO' as TipoRegra,
  canal: 'DISPLAY_PROGRAMATICO' as CanalInventario,
  formato: '',
  modeloCompra: 'CPM' as ModeloCompra,
  nomeRegra: '',
  valor: '',
  formula: '',
  condicoes: '',
  faixaMin: '',
  faixaMax: '',
  unidade: 'CPM',
  ordem: '',
};

export default function AdminRegrasPrecoPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regras, setRegras] = useState<RegraPreco[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | TipoRegra>('TODOS');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) carregarRegras();
  }, [isAdmin]);

  const authHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('auth_token');
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  };

  const carregarRegras = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/regras-preco', { headers: authHeaders() });
      if (!response.ok) throw new Error('Erro ao carregar regras');
      const data = await response.json();
      setRegras(data.regras || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar regras');
    } finally {
      setLoading(false);
    }
  };

  const regrasFiltradas = useMemo(() => {
    if (filtroTipo === 'TODOS') return regras;
    return regras.filter((item) => item.tipoRegra === filtroTipo);
  }, [regras, filtroTipo]);

  const limparFormulario = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const preencherEdicao = (item: RegraPreco) => {
    setEditingId(item.id);
    setForm({
      tipoRegra: item.tipoRegra,
      canal: item.canal,
      formato: item.formato || '',
      modeloCompra: item.modeloCompra,
      nomeRegra: item.nomeRegra || '',
      valor: String(item.valor),
      formula: item.formula || '',
      condicoes: item.condicoes ? JSON.stringify(item.condicoes) : '',
      faixaMin: item.faixaMin == null ? '' : String(item.faixaMin),
      faixaMax: item.faixaMax == null ? '' : String(item.faixaMax),
      unidade: item.unidade,
      ordem: item.ordem == null ? '' : String(item.ordem),
    });
  };

  const salvarRegra = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        tipoRegra: form.tipoRegra,
        canal: form.canal,
        formato: form.formato || undefined,
        modeloCompra: form.modeloCompra,
        nomeRegra: form.nomeRegra,
        valor: Number(form.valor),
        formula: form.formula || undefined,
        condicoes: form.condicoes ? JSON.parse(form.condicoes) : undefined,
        faixaMin: form.faixaMin ? Number(form.faixaMin) : undefined,
        faixaMax: form.faixaMax ? Number(form.faixaMax) : undefined,
        unidade: form.unidade,
        ordem: form.ordem ? Number(form.ordem) : undefined,
      };

      if (!payload.nomeRegra) throw new Error('Informe o nome da regra.');
      if (!payload.valor || payload.valor <= 0) throw new Error('Valor deve ser maior que zero.');

      const response = await fetch(
        editingId ? `/api/admin/regras-preco/${editingId}` : '/api/admin/regras-preco',
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
      if (!response.ok) throw new Error(data.error || 'Erro ao salvar regra');

      setSuccess(editingId ? 'Regra atualizada com sucesso.' : 'Regra criada com sucesso.');
      limparFormulario();
      await carregarRegras();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar regra');
    } finally {
      setSaving(false);
    }
  };

  const alterarStatus = async (item: RegraPreco) => {
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/admin/regras-preco/${item.id}`, {
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
      await carregarRegras();
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
            <h1 className="text-3xl font-bold text-primary-dark mb-2">Regras de Preço</h1>
            <p className="text-gray-600">Gerencie valores fixos e condicionais na mesma tela.</p>
          </div>
          <button onClick={() => router.push('/admin')} className="px-4 py-2 text-gray-600 hover:text-gray-900">
            ← Voltar
          </button>
        </div>

        {error && <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>}
        {success && <div className="p-3 rounded bg-green-50 text-green-700 border border-green-200">{success}</div>}

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold">{editingId ? 'Editar regra' : 'Nova regra'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={form.tipoRegra}
                onChange={(e) => setForm((prev) => ({ ...prev, tipoRegra: e.target.value as TipoRegra }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="FIXO">Fixo</option>
                <option value="CONDICIONAL">Condicional</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Canal</label>
              <select
                value={form.canal}
                onChange={(e) => setForm((prev) => ({ ...prev, canal: e.target.value as CanalInventario }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                {opcoesCanal.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo de Compra</label>
              <select
                value={form.modeloCompra}
                onChange={(e) => setForm((prev) => ({ ...prev, modeloCompra: e.target.value as ModeloCompra }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                {opcoesModeloCompra.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Regra</label>
              <input
                type="text"
                value={form.nomeRegra}
                onChange={(e) => setForm((prev) => ({ ...prev, nomeRegra: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
              <input
                type="text"
                value={form.formato}
                onChange={(e) => setForm((prev) => ({ ...prev, formato: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
              <input
                type="number"
                step="0.0001"
                value={form.valor}
                onChange={(e) => setForm((prev) => ({ ...prev, valor: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
              <input
                type="text"
                value={form.unidade}
                onChange={(e) => setForm((prev) => ({ ...prev, unidade: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fórmula (opcional)</label>
              <input
                type="text"
                value={form.formula}
                onChange={(e) => setForm((prev) => ({ ...prev, formula: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Condições JSON (opcional)</label>
              <textarea
                rows={2}
                value={form.condicoes}
                onChange={(e) => setForm((prev) => ({ ...prev, condicoes: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder='{"regiao":"NACIONAL","faixa":"30k-50k"}'
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={salvarRegra} disabled={saving} className="px-6 py-2 bg-primary text-white rounded-lg">
              {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Criar'}
            </button>
            {editingId && (
              <button onClick={limparFormulario} className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg">
                Cancelar edição
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Regras cadastradas</h2>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="TODOS">Todos</option>
              <option value="FIXO">Fixos</option>
              <option value="CONDICIONAL">Condicionais</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Regra</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Canal</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Formato</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {regrasFiltradas.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-sm">{item.tipoRegra}</td>
                    <td className="px-3 py-2 text-sm">{item.nomeRegra || '-'}</td>
                    <td className="px-3 py-2 text-sm">{canalLabel(item.canal)}</td>
                    <td className="px-3 py-2 text-sm">{item.formato || '-'}</td>
                    <td className="px-3 py-2 text-sm">{item.valor.toFixed(2)}</td>
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
