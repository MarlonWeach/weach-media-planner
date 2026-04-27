/**
 * Componente: Tabela de Preços
 * 
 * Exibe o plano de mídia com canais, formatos, modelos de compra,
 * preços, percentuais de budget e estimativas.
 */

'use client';

import { useState } from 'react';

interface ItemPlanoMidia {
  canal: string;
  formato?: string;
  modeloCompra: string;
  preco: number;
  precoOriginal: number;
  percentualBudget: number;
  valorBudget: number;
  estimativas?: {
    impressoes?: number;
    cliques?: number;
    leads?: number;
  };
}

function obterDescricaoEntregaPorModelo(modeloCompra: string): string {
  const mapaDescricao: Record<string, string> = {
    CPM: 'impressões',
    CPC: 'cliques',
    CPV: 'complete views',
    CPL: 'leads',
    CPI: 'instalações',
    CPA: 'aquisições',
    CPD: 'disparos',
    CPE: 'engajamentos',
  };
  return mapaDescricao[modeloCompra] || 'entregas';
}

function calcularQuantidadeEntrega(
  modeloCompra: string,
  valorBudget: number,
  precoUnitario: number
): number {
  if (!Number.isFinite(precoUnitario) || precoUnitario <= 0) return 0;
  if (modeloCompra === 'CPM') {
    return Math.round((valorBudget / precoUnitario) * 1000);
  }
  return Math.round(valorBudget / precoUnitario);
}

interface PricingTableProps {
  items: ItemPlanoMidia[];
  budgetTotal: number;
  editable?: boolean;
  onPriceChange?: (index: number, novoPreco: number) => { ok: boolean; message?: string };
  onBudgetPercentChange?: (index: number, novoPercentual: number) => { ok: boolean; message?: string };
}

export function PricingTable({
  items,
  budgetTotal,
  editable = false,
  onPriceChange,
  onBudgetPercentChange,
}: PricingTableProps) {
  const [mensagemAjuste, setMensagemAjuste] = useState<string | null>(null);
  // Formatação de moeda
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  };

  // Formatação de número
  const formatarNumero = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  };

  // Formatação de percentual
  const formatarPercentual = (valor: number) => {
    return `${valor.toFixed(2)}%`;
  };

  // Cálculo de totais
  const totais = items.reduce(
    (acc, item) => {
      acc.percentual += item.percentualBudget;
      acc.valorBudget += item.valorBudget;
      acc.impressoes += item.estimativas?.impressoes || 0;
      acc.cliques += item.estimativas?.cliques || 0;
      acc.leads += item.estimativas?.leads || 0;
      acc.entregas += calcularQuantidadeEntrega(item.modeloCompra, item.valorBudget, item.preco);
      return acc;
    },
    {
      percentual: 0,
      valorBudget: 0,
      impressoes: 0,
      cliques: 0,
      leads: 0,
      entregas: 0,
    }
  );

  const handlePriceChange = (index: number, value: string) => {
    if (!onPriceChange) return { ok: true };
    const valorNormalizado = value.trim().replace(',', '.');
    if (!valorNormalizado) return { ok: false, message: 'Preço inválido.' };
    const novoPreco = Number(valorNormalizado);
    if (!Number.isFinite(novoPreco)) return { ok: false, message: 'Preço inválido.' };
    const resultado = onPriceChange(index, novoPreco);
    setMensagemAjuste(resultado.ok ? null : resultado.message || 'Ajuste inválido.');
    return resultado;
  };

  const handleBudgetPercentChange = (index: number, value: string) => {
    if (onBudgetPercentChange) {
      const valorNormalizado = value.trim().replace(',', '.');
      if (!valorNormalizado) return;
      const novoPercentual = Number(valorNormalizado);
      if (!Number.isFinite(novoPercentual)) return;
      const resultado = onBudgetPercentChange(index, novoPercentual);
      setMensagemAjuste(resultado.ok ? null : resultado.message || 'Ajuste inválido.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum item de mídia encontrado
      </div>
    );
  }

  return (
    <div>
      {mensagemAjuste && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {mensagemAjuste}
        </div>
      )}
      <div className="space-y-3 lg:hidden">
        {items.map((item, index) => (
          <div key={`card-${index}`} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{formatarNomeCanal(item.canal)}</p>
                <p className="text-xs text-gray-500">{item.formato || '-'}</p>
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">{item.modeloCompra}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Preco Unit.</p>
                {editable ? (
                  <input
                    key={`preco-mobile-${index}-${item.preco}`}
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={item.preco}
                    onBlur={(e) => {
                      const resultado = handlePriceChange(index, e.target.value);
                      if (!resultado.ok) {
                        e.target.value = String(item.preco);
                      }
                    }}
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-right text-sm"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{formatarMoeda(item.preco)}</p>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-500">% Budget</p>
                {editable ? (
                  <input
                    key={`percentual-mobile-${index}-${item.percentualBudget}`}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    defaultValue={item.percentualBudget}
                    onBlur={(e) => handleBudgetPercentChange(index, e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-right text-sm"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{formatarPercentual(item.percentualBudget)}</p>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-500">Valor Budget</p>
                <p className="font-medium text-gray-900">{formatarMoeda(item.valorBudget)}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Entrega Estimada</p>
                <p className="font-medium text-gray-900">
                  {formatarNumero(calcularQuantidadeEntrega(item.modeloCompra, item.valorBudget, item.preco))}{' '}
                  {obterDescricaoEntregaPorModelo(item.modeloCompra)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden w-full overflow-x-hidden lg:block">
      <table className="w-full table-fixed divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Canal
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Formato
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Modelo
            </th>
            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Preço Unit.
            </th>
            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              % Budget
            </th>
            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Valor Budget
            </th>
            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Entrega Estimada
            </th>
            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cliques
            </th>
            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Leads
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-3 py-4 align-top">
                <div className="text-sm font-medium text-gray-900">
                  {formatarNomeCanal(item.canal)}
                </div>
              </td>
              <td className="px-3 py-4 align-top">
                <div className="text-sm text-gray-500 break-words">
                  {item.formato || '-'}
                </div>
              </td>
              <td className="px-3 py-4 align-top">
                <div className="text-sm text-gray-500">
                  {item.modeloCompra}
                </div>
              </td>
              <td className="px-3 py-4 text-right align-top">
                {editable ? (
                  <input
                    key={`preco-${index}-${item.preco}`}
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={item.preco}
                    onBlur={(e) => {
                      const resultado = handlePriceChange(index, e.target.value);
                      if (!resultado.ok) {
                        e.target.value = String(item.preco);
                      }
                    }}
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                  />
                ) : (
                  <div className="text-sm font-medium text-gray-900">
                    {formatarMoeda(item.preco)}
                  </div>
                )}
              </td>
              <td className="px-3 py-4 text-right align-top">
                {editable ? (
                  <input
                    key={`percentual-${index}-${item.percentualBudget}`}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    defaultValue={item.percentualBudget}
                    onBlur={(e) => handleBudgetPercentChange(index, e.target.value)}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                  />
                ) : (
                  <div className="text-sm text-gray-900">
                    {formatarPercentual(item.percentualBudget)}
                  </div>
                )}
              </td>
              <td className="px-3 py-4 text-right align-top">
                <div className="text-sm font-medium text-gray-900">
                  {formatarMoeda(item.valorBudget)}
                </div>
              </td>
              <td className="px-3 py-4 text-right align-top">
                <div className="text-sm text-gray-500 break-words">
                  {formatarNumero(
                    calcularQuantidadeEntrega(item.modeloCompra, item.valorBudget, item.preco)
                  )}{' '}
                  {obterDescricaoEntregaPorModelo(item.modeloCompra)}
                </div>
              </td>
              <td className="px-3 py-4 text-right align-top">
                <div className="text-sm text-gray-500">
                  {item.estimativas?.cliques
                    ? formatarNumero(item.estimativas.cliques)
                    : '-'}
                </div>
              </td>
              <td className="px-3 py-4 text-right align-top">
                <div className="text-sm text-gray-500">
                  {item.estimativas?.leads
                    ? formatarNumero(item.estimativas.leads)
                    : '-'}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-primary-dark text-white">
          <tr>
            <td
              colSpan={4}
              className="px-3 py-4 text-sm font-bold text-right"
            >
              TOTAIS
            </td>
            <td className="px-3 py-4 whitespace-nowrap text-right">
              <div className="text-sm font-bold">
                {formatarPercentual(totais.percentual)}
              </div>
            </td>
            <td className="px-3 py-4 whitespace-nowrap text-right">
              <div className="text-sm font-bold">
                {formatarMoeda(totais.valorBudget)}
              </div>
            </td>
            <td className="px-3 py-4 whitespace-nowrap text-right">
              <div className="text-sm font-bold">
                {formatarNumero(totais.entregas)}
              </div>
            </td>
            <td className="px-3 py-4 whitespace-nowrap text-right">
              <div className="text-sm font-bold">
                {formatarNumero(totais.cliques)}
              </div>
            </td>
            <td className="px-3 py-4 whitespace-nowrap text-right">
              <div className="text-sm font-bold">
                {formatarNumero(totais.leads)}
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
      </div>

      {/* Resumo adicional */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Budget Total</div>
          <div className="text-lg font-bold text-gray-900">
            {formatarMoeda(budgetTotal)}
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Budget Alocado</div>
          <div className="text-lg font-bold text-gray-900">
            {formatarMoeda(totais.valorBudget)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatarPercentual(totais.percentual)} do total
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Budget Restante</div>
          <div
            className={`text-lg font-bold ${
              budgetTotal - totais.valorBudget >= 0
                ? 'text-gray-900'
                : 'text-red-600'
            }`}
          >
            {formatarMoeda(budgetTotal - totais.valorBudget)}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Formata o nome do canal para exibição
 */
function formatarNomeCanal(canal: string): string {
  const nomes: Record<string, string> = {
    DISPLAY_PROGRAMATICO: 'Display Programático',
    VIDEO_PROGRAMATICO: 'Vídeo Programático',
    CTV: 'CTV',
    AUDIO_DIGITAL: 'Áudio Digital',
    SOCIAL_PROGRAMATICO: 'Social Programático',
    CRM_MEDIA: 'CRM Media',
    IN_LIVE: 'In Live',
    CPL_CPI: 'CPL/CPI',
  };

  return nomes[canal] || canal.replace(/_/g, ' ');
}

