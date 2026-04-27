/**
 * Wizard Step 2: Estratégia e Definição da Campanha
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField } from './FormField';

const objetivos = [
  { value: 'AWARENESS', label: 'Awareness', description: 'Aumentar conhecimento da marca' },
  { value: 'CONSIDERACAO', label: 'Consideração', description: 'Gerar interesse e consideração' },
  { value: 'LEADS', label: 'Leads', description: 'Capturar leads qualificados' },
  { value: 'VENDAS', label: 'Vendas', description: 'Gerar vendas diretas' },
] as const;

const definicoesCampanha = [
  { value: 'PERFORMANCE', label: 'Performance (Weach Adnetwork)' },
  { value: 'PROGRAMATICA', label: 'Programática (DV360, Gama DSP, Social)' },
  { value: 'WHATSAPP_SMS_PUSH', label: 'WhatsApp / SMS / PUSH' },
] as const;

const servicosMensageria = [
  { value: 'SMS_CPD', label: 'SMS - CPD' },
  { value: 'WHATSAPP_CPD', label: 'WhatsApp - CPD' },
  { value: 'PUSH_CPC', label: 'Push - CPC' },
] as const;

const modelosPerformance = [
  { value: 'CPL_LEAD', label: 'CPL - Lead' },
  { value: 'CPI_APP', label: 'CPI (Instalação de App)' },
  { value: 'CLIQUE_DUPLO', label: 'Clique Duplo' },
  { value: 'CPA', label: 'CPA' },
  { value: 'OUTRO', label: 'Outro' },
] as const;

const modelosProgramatica = [
  { value: 'CPM_DISPLAY_NATIVE', label: 'CPM - Display e/ou Native' },
  { value: 'CPC_DISPLAY_NATIVE', label: 'CPC - Display e/ou Native' },
  { value: 'CPM_GAMA_DSP', label: 'CPM - Gama DSP' },
  { value: 'DISPLAY_CPM_RETARGETING', label: 'Display - CPM Retargeting' },
  { value: 'CPV_15_VIDEO', label: 'CPV 15" - Vídeo' },
  { value: 'CPV_30_VIDEO', label: 'CPV 30" - Vídeo' },
  { value: 'CTV_OPEN', label: 'CTV Connect TV - Open' },
  { value: 'CTV_FAST_SAMSUNG', label: 'CTV Connect TV - FAST Samsung' },
  { value: 'CTV_FAST_GLOBO', label: 'CTV Connect TV - FAST Globo' },
  { value: 'CTV_PHILIPS_AOC', label: 'CTV Connect TV - Philips/AOC' },
  { value: 'HBO_MAX_CPCV_30', label: 'HBO / MAX CPCV 30"' },
  { value: 'NATIVE_DIFERENCIADO', label: 'Native Diferenciado (carrossel e etc)' },
  { value: 'FACEBOOK_INSTAGRAM_ENGAJAMENTO', label: 'Facebook / Instagram - Engajamento' },
  { value: 'FACEBOOK_INSTAGRAM_TRAFEGO', label: 'Facebook / Instagram - Tráfego' },
  { value: 'FACEBOOK_INSTAGRAM_LEAD_AD', label: 'Facebook / Instagram - Lead Ad' },
  { value: 'KWAI', label: 'Kwai' },
  { value: 'SPOTIFY_LEADERBOARD', label: 'Spotify Leaderboard' },
  { value: 'SPOTIFY_AUDIO', label: 'Spotify Audio' },
  { value: 'DEEZER_AUDIO', label: 'Deezer Audio' },
  { value: 'SPOTIFY_VIDEO', label: 'Spotify Video' },
  { value: 'DEEZER_VIDEO', label: 'Deezer Video' },
  { value: 'SPOTIFY_OVERLAY', label: 'Spotify Overlay' },
  { value: 'DEEZER_DISPLAY', label: 'Deezer Display' },
  { value: 'LINKEDIN_SPONSORED', label: 'LinkedIn Sponsored' },
  { value: 'LINKEDIN_INMAIL', label: 'LinkedIn Inmail' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'NETFLIX', label: 'Netflix' },
  { value: 'DISNEY_PLUS', label: 'Disney+' },
  { value: 'DISPLAY_GEOFENCE_3KM', label: 'Display Geofence 3km' },
  { value: 'YOUTUBE_BUMPER_6', label: 'YouTube Bumper 6"' },
  { value: 'YOUTUBE_30_CPV', label: 'YouTube 30" CPV' },
  { value: 'OUTRO', label: 'Outro' },
] as const;

const booleanFromRadio = z.preprocess((value) => {
  if (value === null || value === undefined || value === '') return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean().optional());

const ternarioVeiculaOutrasRedes = z.preprocess((value) => {
  if (value === null || value === undefined || value === '') return undefined;
  if (value === true) return 'SIM';
  if (value === false) return 'NAO';
  return value;
}, z.enum(['SIM', 'NAO', 'NAO_SEI']).optional());

const schemaStep2 = z.object({
  objetivo: z
    .string()
    .min(1, 'Selecione o objetivo da campanha')
    .refine(
      (value) => ['AWARENESS', 'CONSIDERACAO', 'LEADS', 'VENDAS'].includes(value),
      'Selecione o objetivo da campanha'
    ) as z.ZodType<'AWARENESS' | 'CONSIDERACAO' | 'LEADS' | 'VENDAS'>,
  definicaoCampanha: z.array(z.enum(['PERFORMANCE', 'PROGRAMATICA', 'WHATSAPP_SMS_PUSH'])).min(1, 'Selecione ao menos uma definição de campanha'),
  servicosMensageria: z.array(z.enum(['SMS_CPD', 'WHATSAPP_CPD', 'PUSH_CPC'])).optional(),
  modelosPerformance: z.array(z.enum(['CPL_LEAD', 'CPI_APP', 'CLIQUE_DUPLO', 'CPA', 'OUTRO'])).optional(),
  modeloPerformanceOutro: z.string().optional(),
  cplCamposCadastro: z.string().optional(),
  cplExigiuFiltro: booleanFromRadio,
  cplQualFiltro: z.string().optional(),
  cplConversaoLeadCompleta: z.string().optional(),
  veiculaOutrasRedes: ternarioVeiculaOutrasRedes,
  veiculaQuaisRedes: z.string().optional(),
  clienteSugeriuValor: booleanFromRadio,
  clienteValorSugerido: z.string().optional(),
  modelosProgramatica: z.array(z.string()).optional(),
  modeloProgramaticaOutro: z.string().optional(),
  segmentacaoExigida: z.string().optional(),
  kpiObjetivo: z.string().optional(),
  precisaDadosAudiencia: booleanFromRadio,
  maturidadeDigital: z.enum(['BAIXA', 'MEDIA', 'ALTA']).default('MEDIA'),
  aceitaModeloHibrido: z.boolean().default(false),
  risco: z.enum(['BAIXA', 'MEDIA', 'ALTA']).default('MEDIA'),
});

export type Step2Data = z.infer<typeof schemaStep2>;

interface WizardStep2Props {
  initialData?: Partial<Step2Data>;
  onSubmit: (data: Step2Data) => void;
  onBack: () => void;
}

export function WizardStep2({
  initialData,
  onSubmit,
  onBack,
}: WizardStep2Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<Step2Data>({
    resolver: zodResolver(schemaStep2),
    defaultValues: {
      definicaoCampanha: [],
      servicosMensageria: [],
      modelosPerformance: [],
      modelosProgramatica: [],
      aceitaModeloHibrido: false,
      maturidadeDigital: 'MEDIA',
      risco: 'MEDIA',
      ...initialData,
    },
  });

  const definicaoCampanha = watch('definicaoCampanha') || [];
  const modelosPerformanceSelecionados = watch('modelosPerformance') || [];
  const modelosProgramaticaSelecionados = watch('modelosProgramatica') || [];
  const exibePerformance = definicaoCampanha.includes('PERFORMANCE');
  const exibeProgramatica = definicaoCampanha.includes('PROGRAMATICA');
  const exibeMensageria = definicaoCampanha.includes('WHATSAPP_SMS_PUSH');
  const exibeDetalhesCpl = modelosPerformanceSelecionados.includes('CPL_LEAD');
  const cplExigiuFiltro = watch('cplExigiuFiltro');
  const veiculaOutrasRedes = watch('veiculaOutrasRedes');
  const clienteSugeriuValor = watch('clienteSugeriuValor');
  const objetivoSelecionado = watch('objetivo');
  const podeAvancar = !!objetivoSelecionado && definicaoCampanha.length > 0;

  const toggleItemArray = (field: 'definicaoCampanha' | 'servicosMensageria' | 'modelosPerformance' | 'modelosProgramatica', value: string) => {
    const valoresAtuais = (watch(field) as string[] | undefined) || [];
    if (valoresAtuais.includes(value)) {
      setValue(field as any, valoresAtuais.filter((item) => item !== value), { shouldValidate: false });
      return;
    }
    setValue(field as any, [...valoresAtuais, value], { shouldValidate: false });
  };

  const handleFormSubmit = (data: Step2Data) => {
    onSubmit(data);
  };

  const handleFormError = (formErrors: any) => {
    const firstErrorField = Object.keys(formErrors || {})[0];
    if (!firstErrorField) return;
    setFocus(firstErrorField as keyof Step2Data);
    const errorElement = document.getElementById(firstErrorField);
    errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit, handleFormError)} className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary-dark mb-2">
          Estratégia da Campanha
        </h2>
        <p className="text-gray-600">
          Defina objetivo, formato de compra e requisitos estratégicos
        </p>
      </div>

      <FormField
        label="Objetivo da Campanha"
        name="objetivo"
        required
        error={errors.objetivo?.message}
        helpText="Selecione o objetivo principal da campanha"
      >
        <select
          id="objetivo"
          {...register('objetivo')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Selecione um objetivo</option>
          {objetivos.map((objetivo) => (
            <option key={objetivo.value} value={objetivo.value}>
              {objetivo.label} - {objetivo.description}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="Definição de Campanha"
        name="definicaoCampanha"
        required
        error={errors.definicaoCampanha?.message}
      >
        <div className="space-y-3">
          {definicoesCampanha.map((definicao) => (
            <label
              key={definicao.value}
              className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={definicaoCampanha.includes(definicao.value)}
                onChange={() => toggleItemArray('definicaoCampanha', definicao.value)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="ml-3 text-gray-700">{definicao.label}</span>
            </label>
          ))}
        </div>
      </FormField>

      {exibeMensageria && (
        <FormField
          label="Serviço WhatsApp / SMS / PUSH"
          name="servicosMensageria"
          required
        >
          <div className="space-y-3">
            {servicosMensageria.map((servico) => (
              <label
                key={servico.value}
                className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={(watch('servicosMensageria') || []).includes(servico.value)}
                  onChange={() => toggleItemArray('servicosMensageria', servico.value)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="ml-3 text-gray-700">{servico.label}</span>
              </label>
            ))}
          </div>
        </FormField>
      )}

      {exibePerformance && (
        <div className="space-y-6 border border-blue-200 rounded-lg p-4 bg-blue-50/30">
          <h3 className="text-lg font-semibold text-gray-900">Campos Adicionais: Performance</h3>

          <FormField label="Modelo de Campanha (Performance)" name="modelosPerformance" required>
            <div className="space-y-3">
              {modelosPerformance.map((modelo) => (
                <label
                  key={modelo.value}
                  className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-white"
                >
                  <input
                    type="checkbox"
                    checked={modelosPerformanceSelecionados.includes(modelo.value)}
                    onChange={() => toggleItemArray('modelosPerformance', modelo.value)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <span className="ml-3 text-gray-700">{modelo.label}</span>
                </label>
              ))}
            </div>
          </FormField>

          {modelosPerformanceSelecionados.includes('OUTRO') && (
            <FormField label="Outro modelo (Performance)" name="modeloPerformanceOutro">
              <input
                type="text"
                {...register('modeloPerformanceOutro')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Descreva o modelo adicional"
              />
            </FormField>
          )}

          {exibeDetalhesCpl && (
            <>
              <FormField label="No caso de CPL, quais campos de cadastro são necessários?" name="cplCamposCadastro" required>
                <textarea
                  {...register('cplCamposCadastro')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </FormField>

              <FormField label="No caso de CPL, o cliente exigiu filtro?" name="cplExigiuFiltro" required>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" value="true" {...register('cplExigiuFiltro')} />
                    Sim
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" value="false" {...register('cplExigiuFiltro')} />
                    Não
                  </label>
                </div>
              </FormField>

              {cplExigiuFiltro === true && (
                <FormField label="Qual filtro foi exigido?" name="cplQualFiltro" required>
                  <textarea
                    {...register('cplQualFiltro')}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                </FormField>
              )}

              <FormField label="No caso de CPL, descreva a conversão do lead completa" name="cplConversaoLeadCompleta" required>
                <textarea
                  {...register('cplConversaoLeadCompleta')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </FormField>
            </>
          )}

          <FormField label="O cliente está veiculando em outras redes?" name="veiculaOutrasRedes" required>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" value="SIM" {...register('veiculaOutrasRedes')} />
                Sim
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" value="NAO" {...register('veiculaOutrasRedes')} />
                Não
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" value="NAO_SEI" {...register('veiculaOutrasRedes')} />
                Não sei
              </label>
            </div>
          </FormField>

          {veiculaOutrasRedes === 'SIM' && (
            <FormField label="Quais redes?" name="veiculaQuaisRedes" required>
              <textarea
                {...register('veiculaQuaisRedes')}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </FormField>
          )}

          <FormField label="O cliente sugeriu valor do CPA ou CPL?" name="clienteSugeriuValor" required>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" value="true" {...register('clienteSugeriuValor')} />
                Sim
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" value="false" {...register('clienteSugeriuValor')} />
                Não
              </label>
            </div>
          </FormField>

          {clienteSugeriuValor === true && (
            <FormField label="Valor sugerido pelo cliente" name="clienteValorSugerido" required>
              <input
                type="text"
                {...register('clienteValorSugerido')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ex: CPL R$ 25,00 / CPA R$ 80,00"
              />
            </FormField>
          )}
        </div>
      )}

      {exibeProgramatica && (
        <div className="space-y-6 border border-purple-200 rounded-lg p-4 bg-purple-50/30">
          <h3 className="text-lg font-semibold text-gray-900">Campos Adicionais: Programática</h3>

          <FormField label="Modelo de Campanha (Programática)" name="modelosProgramatica" required>
            <div className="space-y-2 max-h-72 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-white">
              {modelosProgramatica.map((modelo) => (
                <label key={modelo.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={modelosProgramaticaSelecionados.includes(modelo.value)}
                    onChange={() => toggleItemArray('modelosProgramatica', modelo.value)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{modelo.label}</span>
                </label>
              ))}
            </div>
          </FormField>

          {modelosProgramaticaSelecionados.includes('OUTRO') && (
            <FormField label="Outro modelo (Programática)" name="modeloProgramaticaOutro">
              <input
                type="text"
                {...register('modeloProgramaticaOutro')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Descreva o modelo adicional"
              />
            </FormField>
          )}

          <FormField label="Qual a segmentação exigida pelo anunciante?" name="segmentacaoExigida" required>
            <textarea
              {...register('segmentacaoExigida')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </FormField>

          <FormField label="KPI Objetivo" name="kpiObjetivo" required>
            <input
              type="text"
              {...register('kpiObjetivo')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ex: CPL, CPA, CTR, VTR, alcance único"
            />
          </FormField>

          <FormField label="Precisa de dados de audiência para a proposta?" name="precisaDadosAudiencia" required>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" value="true" {...register('precisaDadosAudiencia')} />
                Sim
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" value="false" {...register('precisaDadosAudiencia')} />
                Não
              </label>
            </div>
          </FormField>
        </div>
      )}

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

