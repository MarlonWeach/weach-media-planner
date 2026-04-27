/**
 * Wizard Step 1: Dados Gerais da Solicitação
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField } from './FormField';
import dayjs from 'dayjs';

const segmentos = [
  { value: 'AUTOMOTIVO', label: 'Automotivo' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
  { value: 'VAREJO', label: 'Varejo' },
  { value: 'IMOBILIARIO', label: 'Imobiliário' },
  { value: 'SAUDE', label: 'Saúde' },
  { value: 'EDUCACAO', label: 'Educação' },
  { value: 'TELECOM', label: 'Telecom' },
  { value: 'SERVICOS', label: 'Serviços' },
  { value: 'OUTROS', label: 'Outros' },
] as const;

const uuidRegex =
  /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;

function normalizarUrlComHttps(url: string): string {
  const valor = url.trim();
  if (valor === '') return '';
  if (valor.startsWith('http://') || valor.startsWith('https://')) {
    return valor;
  }
  return `https://${valor.replace(/^\/+/, '')}`;
}

const schemaStep1 = z.object({
  solicitanteId: z.string().min(1, 'Solicitante é obrigatório'),
  solicitanteNome: z.string().min(1, 'Nome do solicitante é obrigatório'),
  solicitanteEmail: z.string().email('Email do solicitante inválido'),
  dataSolicitacao: z.string().min(1, 'Data da solicitação é obrigatória'),
  anuncianteCampanha: z.string().min(1, 'Nome do anunciante e campanha é obrigatório'),
  agenciaId: z.preprocess(
    (value) => {
      if (typeof value !== 'string') return undefined;
      const normalizedValue = value.trim();
      if (normalizedValue === '') return undefined;
      return uuidRegex.test(normalizedValue) ? normalizedValue : undefined;
    },
    z.string().uuid('Agência inválida').optional()
  ),
  agenciaNome: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().optional()
  ),
  clienteNome: z.string().optional(),
  clienteSegmento: z.string().min(1, 'Segmento é obrigatório'),
  urlLp: z
    .preprocess(
      (value) => (typeof value === 'string' ? normalizarUrlComHttps(value) : value),
      z.string().min(1, 'URL da campanha / Landing Page é obrigatória')
    )
    .refine(
      (url: string) =>
        url.length === 0 || url.startsWith('http://') || url.startsWith('https://'),
      'URL deve começar com http:// ou https://'
    ),
  cotacaoProativa: z.boolean().default(false),
  observacoesGerais: z.string().optional(),
  observacoes: z.string().optional(),
});

export type Step1Data = z.infer<typeof schemaStep1>;

interface WizardStep1Props {
  initialData?: Partial<Step1Data>;
  onSubmit: (data: Step1Data) => void;
  onBack?: () => void;
}

export function WizardStep1({
  initialData,
  onSubmit,
  onBack,
}: WizardStep1Props) {
  const [solicitantes, setSolicitantes] = useState<Array<{ id: string; nome: string; email: string }>>([]);
  const [agencias, setAgencias] = useState<Array<{ id: string; nome: string }>>([]);

  const dataSolicitacaoPadrao = useMemo(
    () => dayjs().format('YYYY-MM-DDTHH:mm'),
    []
  );

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    setFocus,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Step1Data>({
    resolver: zodResolver(schemaStep1),
    defaultValues: {
      dataSolicitacao: initialData?.dataSolicitacao || dataSolicitacaoPadrao,
      cotacaoProativa: initialData?.cotacaoProativa ?? false,
      ...initialData,
    },
  });
  const solicitanteIdSelecionado = watch('solicitanteId');
  const anuncianteCampanha = watch('anuncianteCampanha');
  const urlLp = watch('urlLp');
  const clienteSegmento = watch('clienteSegmento');
  const podeAvancar =
    !!solicitanteIdSelecionado &&
    !!anuncianteCampanha?.trim() &&
    !!urlLp?.trim() &&
    !!clienteSegmento;

  useEffect(() => {
    // Regra de negócio: para nova cotação, sempre usar timestamp atual no momento
    // em que o formulário é carregado.
    setValue('dataSolicitacao', dayjs().format('YYYY-MM-DDTHH:mm'));
  }, [setValue]);

  useEffect(() => {
    const carregarOpcoes = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const response = await fetch('/api/metadata/form-options', { headers });
        if (!response.ok) return;

        const data = await response.json();
        const solicitantesCarregados = data.solicitantes || [];
        const agenciasCarregadas = data.agencias || [];

        setSolicitantes(solicitantesCarregados);
        setAgencias(agenciasCarregadas);

        const solicitanteAtual = getValues('solicitanteId');
        const agenciaAtual = getValues('agenciaId');

        if (
          solicitanteAtual &&
          !solicitantesCarregados.some((item: { id: string }) => item.id === solicitanteAtual)
        ) {
          setValue('solicitanteId', '' as any, { shouldValidate: false });
          setValue('solicitanteNome', '');
          setValue('solicitanteEmail', '');
        }

        if (
          agenciaAtual &&
          !agenciasCarregadas.some((item: { id: string }) => item.id === agenciaAtual)
        ) {
          setValue('agenciaId', undefined as any, { shouldValidate: false });
          setValue('agenciaNome', '');
        }
      } catch (error) {
        console.error('Erro ao carregar listas do formulário:', error);
      }
    };

    carregarOpcoes();
  }, [getValues, setValue]);

  const handleFormSubmit = (data: Step1Data) => {
    data.urlLp = normalizarUrlComHttps(data.urlLp);
    data.clienteNome = data.anuncianteCampanha;
    data.observacoes = data.observacoesGerais;
    onSubmit(data);
  };

  const handleFormError = (formErrors: any) => {
    const firstErrorField = Object.keys(formErrors || {})[0];
    if (!firstErrorField) return;

    setFocus(firstErrorField as keyof Step1Data);
    const errorElement = document.getElementById(firstErrorField);
    errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit, handleFormError)} className="space-y-6">
      <input type="hidden" {...register('solicitanteNome')} />
      <input type="hidden" {...register('solicitanteEmail')} />
      <input type="hidden" {...register('agenciaNome')} />

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary-dark mb-2">
          Dados da Solicitação
        </h2>
        <p className="text-gray-600">
          Informe os dados principais de anunciante, campanha e contexto comercial
        </p>
      </div>

      <FormField
        label="Nome do Solicitante"
        name="solicitanteId"
        required
        error={errors.solicitanteId?.message}
        helpText={!solicitanteIdSelecionado ? 'Selecione um solicitante para habilitar o avanço.' : undefined}
      >
        <Controller
          control={control}
          name="solicitanteId"
          render={({ field }) => (
            <select
              id="solicitanteId"
              value={field.value || ''}
              onChange={(event) => {
                field.onChange(event.target.value);
                const selecionado = solicitantes.find((item) => item.id === event.target.value);
                setValue('solicitanteNome', selecionado?.nome || '');
                setValue('solicitanteEmail', selecionado?.email || '');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Selecione o solicitante</option>
              {solicitantes.map((solicitante) => (
                <option key={solicitante.id} value={solicitante.id}>
                  {solicitante.nome} ({solicitante.email})
                </option>
              ))}
            </select>
          )}
        />
      </FormField>

      <FormField
        label="Data da Solicitação"
        name="dataSolicitacao"
        required
        error={errors.dataSolicitacao?.message}
        helpText="Preenchido automaticamente com data e hora atual"
      >
        <input
          type="datetime-local"
          id="dataSolicitacao"
          {...register('dataSolicitacao')}
          readOnly
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </FormField>

      <FormField
        label="Nome do Anunciante e Campanha"
        name="anuncianteCampanha"
        required
        error={errors.anuncianteCampanha?.message}
      >
        <input
          type="text"
          id="anuncianteCampanha"
          {...register('anuncianteCampanha')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Ex: Marca X - Campanha Dia das Mães"
        />
      </FormField>

      <FormField
        label="Agência"
        name="agenciaId"
        error={errors.agenciaId?.message}
        helpText="Opcional para campanhas sem agência"
      >
        <select
          id="agenciaId"
          {...register('agenciaId', {
            onChange: (event) => {
              const selecionada = agencias.find((item) => item.id === event.target.value);
              setValue('agenciaNome', selecionada?.nome || '');
            },
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Sem agência</option>
          {agencias.map((agencia) => (
            <option key={agencia.id} value={agencia.id}>
              {agencia.nome}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="URL da campanha / Landing Page"
        name="urlLp"
        required
        error={errors.urlLp?.message}
        helpText="Se você digitar sem protocolo, o https:// será incluído automaticamente."
      >
        <input
          type="url"
          id="urlLp"
          {...register('urlLp', {
            onBlur: (event) => {
              const valorNormalizado = normalizarUrlComHttps(event.target.value || '');
              setValue('urlLp', valorNormalizado, { shouldValidate: false });
            },
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="https://www.campanha.com.br"
        />
      </FormField>

      <FormField
        label="Segmento"
        name="clienteSegmento"
        required
        error={errors.clienteSegmento?.message}
        helpText="Selecione o segmento de atuação do cliente"
      >
        <select
          id="clienteSegmento"
          {...register('clienteSegmento')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Selecione um segmento</option>
          {segmentos.map((segmento) => (
            <option key={segmento.value} value={segmento.value}>
              {segmento.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Esta cotação é pró-ativa?" name="cotacaoProativa">
        <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            {...register('cotacaoProativa')}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <span className="ml-3 text-gray-700">Sim, esta cotação é pró-ativa</span>
        </label>
      </FormField>

      <FormField
        label="Observações Gerais"
        name="observacoesGerais"
        helpText="Inclua informações relevantes para o planejamento (opcional)"
      >
        <textarea
          id="observacoesGerais"
          {...register('observacoesGerais')}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          placeholder="Ex: contexto comercial, urgência, restrições ou preferências..."
        />
      </FormField>

      <div className="flex justify-between pt-6 border-t border-gray-200">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Voltar
          </button>
        ) : (
          <div />
        )}
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

