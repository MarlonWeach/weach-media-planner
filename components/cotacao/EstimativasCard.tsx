/**
 * Componente: EstimativasCard
 * 
 * Exibe estimativas calculadas de forma visual
 */

'use client';

interface EstimativasCardProps {
  estimativas: {
    impressoes: number;
    cliques: number;
    leads: number;
    cpmEstimado: number;
    cpcEstimado: number;
    cplEstimado: number;
    exibirMetricasLeads?: boolean;
  };
  budgetTotal: number;
}

export function EstimativasCard({
  estimativas,
  budgetTotal,
}: EstimativasCardProps) {
  const formatarNumero = (valor: number) => {
    if (valor >= 1000000) {
      return `${(valor / 1000000).toFixed(1)}M`;
    }
    if (valor >= 1000) {
      return `${(valor / 1000).toFixed(1)}k`;
    }
    return valor.toLocaleString('pt-BR');
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  };

  const cards = [
    {
      titulo: 'Impressões',
      valor: formatarNumero(estimativas.impressoes),
      descricao: 'Visualizações estimadas',
      cor: 'bg-blue-50 border-blue-200',
      texto: 'text-blue-800',
    },
    {
      titulo: 'Cliques',
      valor: formatarNumero(estimativas.cliques),
      descricao: 'Cliques estimados',
      cor: 'bg-green-50 border-green-200',
      texto: 'text-green-800',
    },
    {
      titulo: 'eCPM',
      valor: formatarMoeda(estimativas.cpmEstimado),
      descricao: 'Custo por mil impressões',
      cor: 'bg-yellow-50 border-yellow-200',
      texto: 'text-yellow-800',
    },
    {
      titulo: 'eCPC',
      valor: formatarMoeda(estimativas.cpcEstimado),
      descricao: 'Custo por clique',
      cor: 'bg-orange-50 border-orange-200',
      texto: 'text-orange-800',
    },
  ];

  if (estimativas.exibirMetricasLeads) {
    cards.push(
      {
        titulo: 'Leads',
        valor: formatarNumero(estimativas.leads),
        descricao: 'Leads estimados',
        cor: 'bg-purple-50 border-purple-200',
        texto: 'text-purple-800',
      },
      {
        titulo: 'CPL',
        valor: formatarMoeda(estimativas.cplEstimado),
        descricao: 'Custo por lead',
        cor: 'bg-pink-50 border-pink-200',
        texto: 'text-pink-800',
      }
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Estimativas de Resultados do Plano de Mídia Completo
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`${card.cor} border rounded-lg p-4`}
          >
            <div className={`text-sm font-medium ${card.texto} mb-1`}>
              {card.titulo}
            </div>
            <div className={`text-2xl font-bold ${card.texto} mb-1`}>
              {card.valor}
            </div>
            <div className="text-xs text-gray-600">{card.descricao}</div>
          </div>
        ))}
      </div>

      {/* Resumo adicional */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Budget Total</div>
          <div className="text-xl font-bold text-gray-900">
            {formatarMoeda(budgetTotal)}
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Taxa de Clique (eCTR)</div>
          <div className="text-xl font-bold text-gray-900">
            {estimativas.impressoes > 0
              ? ((estimativas.cliques / estimativas.impressoes) * 100).toFixed(2)
              : '0.00'}
            %
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Taxa de Conversão</div>
          <div className="text-xl font-bold text-gray-900">
            {estimativas.cliques > 0
              ? ((estimativas.leads / estimativas.cliques) * 100).toFixed(2)
              : '0.00'}
            %
          </div>
        </div>
      </div>
    </div>
  );
}

