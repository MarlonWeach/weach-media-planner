/**
 * Wizard Step 3: Budget, Período e Região
 * 
 * Campos:
 * - Budget total
 * - Data de início
 * - Data de término
 * - Região
 * - Mix manual (opcional)
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField } from './FormField';
import dayjs from 'dayjs';
import { identificarCidadesNaoReconhecidas } from '@/lib/utils/cidades';

const tiposRegiao = [
  { value: 'NACIONAL', label: 'Nacional' },
  { value: 'ESTADO', label: 'Estado' },
  { value: 'CIDADES', label: 'Cidades' },
] as const;

const estadosBrasil = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
] as const;

const schemaStep3 = z.object({
  budget: z
    .number()
    .min(1000, 'Budget mínimo é R$ 1.000,00')
    .max(10000000, 'Budget máximo é R$ 10.000.000,00'),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().min(1, 'Data de término é obrigatória'),
  tipoRegiao: z.enum(['NACIONAL', 'ESTADO', 'CIDADES']),
  estadosSelecionados: z.array(z.string()).optional(),
  cidades: z.string().optional(),
}).refine(
  (data) => {
    if (!data.dataInicio || !data.dataFim) return true;
    const inicio = dayjs(data.dataInicio);
    const fim = dayjs(data.dataFim);
    return fim.isAfter(inicio) || fim.isSame(inicio, 'day');
  },
  {
    message: 'Data de término deve ser posterior ou igual à data de início',
    path: ['dataFim'],
  }
).refine(
  (data) => data.tipoRegiao !== 'ESTADO' || (data.estadosSelecionados && data.estadosSelecionados.length > 0),
  {
    message: 'Selecione pelo menos um estado',
    path: ['estadosSelecionados'],
  }
).refine(
  (data) => data.tipoRegiao !== 'CIDADES' || !!data.cidades?.trim(),
  {
    message: 'Informe as cidades para a região selecionada',
    path: ['cidades'],
  }
);

export type Step3Data = z.infer<typeof schemaStep3>;

interface WizardStep3Props {
  initialData?: Partial<Step3Data>;
  onSubmit: (data: Step3Data) => void;
  onBack: () => void;
}

export function WizardStep3({
  initialData,
  onSubmit,
  onBack,
}: WizardStep3Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setFocus,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<Step3Data>({
    resolver: zodResolver(schemaStep3),
    defaultValues: {
      tipoRegiao: 'NACIONAL',
      estadosSelecionados: [],
      ...initialData,
    },
  });

  const handleFormSubmit = (data: Step3Data) => {
    if (data.tipoRegiao === 'CIDADES' && data.cidades) {
      const cidadesNaoReconhecidas = identificarCidadesNaoReconhecidas(data.cidades);
      if (cidadesNaoReconhecidas.length > 0) {
        setError('cidades', {
          type: 'manual',
          message: `Não identificamos as cidades: ${cidadesNaoReconhecidas.join(
            ', '
          )}. Confira a escrita e tente novamente.`,
        });
        return;
      }
      clearErrors('cidades');
    }

    if (data.tipoRegiao !== 'ESTADO') {
      data.estadosSelecionados = [];
    }
    if (data.tipoRegiao !== 'CIDADES') {
      data.cidades = '';
    }
    onSubmit(data);
  };

  const handleFormError = (formErrors: any) => {
    const firstErrorField = Object.keys(formErrors || {})[0];
    if (!firstErrorField) return;
    setFocus(firstErrorField as keyof Step3Data);
    const errorElement = document.getElementById(firstErrorField);
    errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const tipoRegiao = watch('tipoRegiao');
  const estadosSelecionados = watch('estadosSelecionados') || [];
  const budget = watch('budget');
  const dataInicio = watch('dataInicio');
  const dataFim = watch('dataFim');
  const cidades = watch('cidades');
  const regiaoValida =
    tipoRegiao === 'NACIONAL' ||
    (tipoRegiao === 'ESTADO' && estadosSelecionados.length > 0) ||
    (tipoRegiao === 'CIDADES' && !!cidades?.trim());
  const podeAvancar =
    Number.isFinite(budget) &&
    Number(budget) >= 1000 &&
    !!dataInicio &&
    !!dataFim &&
    !!tipoRegiao &&
    regiaoValida;

  const toggleEstado = (estado: string) => {
    if (estadosSelecionados.includes(estado)) {
      setValue(
        'estadosSelecionados',
        estadosSelecionados.filter((item) => item !== estado),
        { shouldValidate: true }
      );
      return;
    }

    setValue('estadosSelecionados', [...estadosSelecionados, estado], {
      shouldValidate: true,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit, handleFormError)} className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary-dark mb-2">
          Budget, Período e Região
        </h2>
        <p className="text-gray-600">
          Defina o investimento, período de execução e região da campanha
        </p>
      </div>

      <FormField
        label="Budget Total"
        name="budget"
        required
        error={errors.budget?.message}
        helpText="Valor mínimo: R$ 1.000,00"
      >
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
            R$
          </span>
          <input
            type="number"
            id="budget"
            step="0.01"
            min="1000"
            {...register('budget', { valueAsNumber: true })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="10000.00"
          />
        </div>
        {watch('budget') && (
          <p className="mt-1 text-sm text-gray-600">
            {formatarMoeda(watch('budget') || 0)}
          </p>
        )}
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Data de Início"
          name="dataInicio"
          required
          error={errors.dataInicio?.message}
        >
          <input
            type="date"
            id="dataInicio"
            {...register('dataInicio')}
            min={dayjs().format('YYYY-MM-DD')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </FormField>

        <FormField
          label="Data de Término"
          name="dataFim"
          required
          error={errors.dataFim?.message}
        >
          <input
            type="date"
            id="dataFim"
            {...register('dataFim')}
            min={watch('dataInicio') || dayjs().format('YYYY-MM-DD')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </FormField>
      </div>

      <FormField
        label="Região"
        name="tipoRegiao"
        required
        error={errors.tipoRegiao?.message}
        helpText="Selecione a região geográfica de atuação da campanha"
      >
        <select
          id="tipoRegiao"
          {...register('tipoRegiao')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Selecione uma região</option>
          {tiposRegiao.map((regiao) => (
            <option key={regiao.value} value={regiao.value}>
              {regiao.label}
            </option>
          ))}
        </select>
      </FormField>

      {tipoRegiao === 'ESTADO' && (
        <FormField
          label="Selecione os estados"
          name="estadosSelecionados"
          required
          error={errors.estadosSelecionados?.message}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border border-gray-300 rounded-lg">
            {estadosBrasil.map((estado) => (
              <label key={estado.value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={estadosSelecionados.includes(estado.value)}
                  onChange={() => toggleEstado(estado.value)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span>{estado.label}</span>
              </label>
            ))}
          </div>
        </FormField>
      )}

      {tipoRegiao === 'CIDADES' && (
        <FormField
          label="Cidades"
          name="cidades"
          required
          error={errors.cidades?.message}
          helpText="Informe as cidades separadas por vírgula"
        >
          <textarea
            {...register('cidades')}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            placeholder="Ex: São Paulo, Campinas, Ribeirão Preto"
          />
        </FormField>
      )}

      {tipoRegiao === 'NACIONAL' && (
        <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-900">
          A campanha será configurada para cobertura nacional.
        </div>
      )}

      <div className="pt-6 border-t border-gray-200">
        {errors.root?.message && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
            {errors.root.message}
          </div>
        )}
        {errors.estadosSelecionados?.message && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
            {errors.estadosSelecionados.message}
          </div>
        )}
        {errors.cidades?.message && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
            {errors.cidades.message}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Voltar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !podeAvancar}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Salvando...' : 'Próximo'}
        </button>
      </div>
    </form>
  );
}

