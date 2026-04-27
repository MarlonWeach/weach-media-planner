/**
 * Componente: EditablePriceCell
 * 
 * Célula editável de preço com validação em tempo real
 */

'use client';

import { useState, useEffect } from 'react';
import { useValidacaoPreco } from './GovernanceValidator';
import { RegraGovernanca } from '@/lib/pricing/regrasGovernanca';

interface EditablePriceCellProps {
  value: number;
  regra?: RegraGovernanca;
  onChange: (novoValor: number) => void;
  formato?: 'moeda' | 'numero';
}

export function EditablePriceCell({
  value,
  regra,
  onChange,
  formato = 'moeda',
}: EditablePriceCellProps) {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isEditing, setIsEditing] = useState(false);
  const validacao = useValidacaoPreco(value, regra);

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  };

  const handleBlur = () => {
    const numValue = parseFloat(inputValue) || 0;
    onChange(numValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setInputValue(value.toString());
      setIsEditing(false);
    }
  };

  const borderColor = !validacao.valido
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
    : validacao.aviso
    ? 'border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500'
    : 'border-gray-300 focus:border-primary focus:ring-primary';

  return (
    <div className="relative">
      {isEditing ? (
        <input
          type="number"
          step="0.01"
          min="0"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full px-2 py-1 text-sm border rounded ${borderColor} focus:outline-none focus:ring-2`}
          autoFocus
        />
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className={`px-2 py-1 text-sm border rounded cursor-pointer hover:bg-gray-50 ${borderColor}`}
          title="Clique para editar"
        >
          {formato === 'moeda' ? formatarMoeda(value) : value.toFixed(2)}
        </div>
      )}
      {!validacao.valido && validacao.erro && (
        <div className="absolute z-10 mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800 shadow-lg">
          {validacao.erro}
        </div>
      )}
      {validacao.aviso && (
        <div className="absolute z-10 mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 shadow-lg">
          {validacao.aviso}
        </div>
      )}
    </div>
  );
}

