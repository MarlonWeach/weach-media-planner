/**
 * Componente: CotacaoCard
 * 
 * Card individual de cotação no dashboard
 */

'use client';

import Link from 'next/link';
import dayjs from 'dayjs';

interface CotacaoCardProps {
  id: string;
  clienteNome: string;
  clienteSegmento: string;
  budget: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  vendedorNome: string;
}

export function CotacaoCard({
  id,
  clienteNome,
  clienteSegmento,
  budget,
  status,
  createdAt,
  updatedAt,
  vendedorNome,
}: CotacaoCardProps) {
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  };

  const formatarNomeSegmento = (segmento: string) => {
    const nomes: Record<string, string> = {
      AUTOMOTIVO: 'Automotivo',
      FINANCEIRO: 'Financeiro',
      VAREJO: 'Varejo',
      IMOBILIARIO: 'Imobiliário',
      SAUDE: 'Saúde',
      EDUCACAO: 'Educação',
      TELECOM: 'Telecom',
      SERVICOS: 'Serviços',
      OUTROS: 'Outros',
    };
    return nomes[segmento] || segmento;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      RASCUNHO: {
        label: 'Rascunho',
        className: 'bg-gray-100 text-gray-800',
      },
      ENVIADA: {
        label: 'Enviada',
        className: 'bg-blue-100 text-blue-800',
      },
      APROVADA: {
        label: 'Aprovada',
        className: 'bg-green-100 text-green-800',
      },
      RECUSADA: {
        label: 'Recusada',
        className: 'bg-red-100 text-red-800',
      },
      EM_EXECUCAO: {
        label: 'Em Execução',
        className: 'bg-purple-100 text-purple-800',
      },
      FINALIZADA: {
        label: 'Finalizada',
        className: 'bg-gray-100 text-gray-800',
      },
      AGUARDANDO_APROVACAO: {
        label: 'Aguardando Aprovação',
        className: 'bg-yellow-100 text-yellow-800',
      },
    };

    return badges[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
  };

  const statusBadge = getStatusBadge(status);
  const podeEditar = status === 'RASCUNHO';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {clienteNome}
          </h3>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>{formatarNomeSegmento(clienteSegmento)}</span>
            <span>•</span>
            <span>{formatarMoeda(budget)}</span>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}
        >
          {statusBadge.label}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div>
          <span className="font-medium">Vendedor:</span> {vendedorNome}
        </div>
        <div>
          Criada em {dayjs(createdAt).format('DD/MM/YYYY')}
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <Link
          href={`/cotacao/${id}`}
          className="flex-1 px-4 py-2 text-sm text-center text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
        >
          Visualizar
        </Link>
        {podeEditar && (
          <Link
            href={`/cotacao/${id}/editar`}
            className="flex-1 px-4 py-2 text-sm text-center text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Editar
          </Link>
        )}
        <button
          onClick={async () => {
            try {
              const response = await fetch(`/api/cotacao/${id}/pdf`, {
                method: 'POST',
                headers: {
                  'x-user-id': '00000000-0000-0000-0000-000000000000', // TODO: Obter do contexto
                },
              });

              if (!response.ok) {
                throw new Error('Erro ao gerar PDF');
              }

              const data = await response.json();
              if (data.pdfUrl) {
                window.open(data.pdfUrl, '_blank');
              }
            } catch (err) {
              alert('Erro ao gerar PDF. Tente novamente.');
            }
          }}
          className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          PDF
        </button>
      </div>
    </div>
  );
}

