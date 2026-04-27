/**
 * Componente: GovernanceValidator
 * 
 * Valida preços contra regras de governança e exibe alertas
 */

'use client';

import { useEffect, useMemo } from 'react';
import { validarPreco, RegraGovernanca, ResultadoValidacao } from '@/lib/pricing/regrasGovernanca';
import { AlertBox } from './AlertBox';

interface ItemValidacao {
  canal: string;
  preco: number;
  regra?: RegraGovernanca;
}

interface GovernanceValidatorProps {
  items: ItemValidacao[];
  onValidationChange?: (temErros: boolean, temAvisos: boolean) => void;
}

export function GovernanceValidator({
  items,
  onValidationChange,
}: GovernanceValidatorProps) {
  const validacoes = useMemo(() => {
    const resultados: Array<{
      item: ItemValidacao;
      validacao: ResultadoValidacao;
    }> = [];

    items.forEach((item) => {
      if (!item.regra) return;

      const validacao = validarPreco(item.preco, item.regra);
      resultados.push({ item, validacao });
    });

    return resultados;
  }, [items]);

  const erros = validacoes.filter((v) => !v.validacao.valido && v.validacao.erro);
  const avisos = validacoes.filter((v) => v.validacao.aviso);
  const requerAprovacao = validacoes.some((v) => v.validacao.requerAprovacao);

  // Notifica mudanças na validação
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(erros.length > 0, avisos.length > 0 || requerAprovacao);
    }
  }, [erros.length, avisos.length, requerAprovacao, onValidationChange]);

  if (erros.length === 0 && avisos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {erros.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">
            Erros de Validação ({erros.length})
          </h3>
          {erros.map((erro, index) => (
            <AlertBox
              key={index}
              type="error"
              title={`${erro.item.canal}: ${erro.validacao.erro}`}
              message={
                erro.validacao.requerAprovacao
                  ? 'Este valor requer aprovação administrativa antes de prosseguir.'
                  : 'Corrija este valor para continuar.'
              }
            />
          ))}
        </div>
      )}

      {avisos.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">
            Avisos ({avisos.length})
          </h3>
          {avisos.map((aviso, index) => (
            <AlertBox
              key={index}
              type="warning"
              title={`${aviso.item.canal}`}
              message={aviso.validacao.aviso || ''}
            />
          ))}
        </div>
      )}

      {requerAprovacao && (
        <AlertBox
          type="info"
          title="Aprovação Necessária"
          message="Alguns valores estão fora dos limites normais e requerem aprovação administrativa. Você pode salvar como rascunho, mas não poderá finalizar a cotação até obter aprovação."
        />
      )}
    </div>
  );
}

/**
 * Hook para validar um preço individual
 */
export function useValidacaoPreco(
  preco: number,
  regra?: RegraGovernanca
): ResultadoValidacao {
  return useMemo(() => {
    if (!regra) {
      return { valido: true };
    }
    return validarPreco(preco, regra);
  }, [preco, regra]);
}

