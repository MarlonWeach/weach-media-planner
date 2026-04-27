/**
 * Página: Editar Cotação (Rascunho)
 * 
 * Permite retomar e editar uma cotação salva como rascunho
 */

'use client';

import { useState, useEffect } from 'react';
import { WizardStep1, Step1Data } from '@/components/cotacao/WizardStep1';
import { WizardStep2, Step2Data } from '@/components/cotacao/WizardStep2';
import { WizardStep3, Step3Data } from '@/components/cotacao/WizardStep3';
import { WizardStep4 } from '@/components/cotacao/WizardStep4';
import dayjs from 'dayjs';

type WizardStep = 1 | 2 | 3 | 4;

export default function EditarCotacaoPage({
  params,
}: {
  params: { id: string };
}) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wizardData, setWizardData] = useState({
    step1: null as Step1Data | null,
    step2: null as Step2Data | null,
    step3: null as Step3Data | null,
  });

  useEffect(() => {
    carregarCotacao();
  }, [params.id]);

  const carregarCotacao = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cotacao/${params.id}`, {
        headers: {
          'x-user-id': '00000000-0000-0000-0000-000000000000', // TODO: Obter do contexto
        },
      });

      if (!response.ok) {
        throw new Error('Cotação não encontrada');
      }

      const data = await response.json();
      const cotacao = data.cotacao;

      // Determina em qual passo está baseado nos dados preenchidos
      if (cotacao.mixSugerido && Object.keys(cotacao.mixSugerido).length > 0) {
        setCurrentStep(4);
      } else if (cotacao.budget && cotacao.regiao) {
        setCurrentStep(3);
      } else if (cotacao.objetivo) {
        setCurrentStep(2);
      } else {
        setCurrentStep(1);
      }

      const dataInicioStr =
        typeof cotacao.dataInicio === 'string'
          ? cotacao.dataInicio.split('T')[0]
          : dayjs(cotacao.dataInicio).format('YYYY-MM-DD');
      const dataFimStr =
        typeof cotacao.dataFim === 'string'
          ? cotacao.dataFim.split('T')[0]
          : dayjs(cotacao.dataFim).format('YYYY-MM-DD');

      // Preenche dados dos passos (formato alinhado a Step1/2/3)
      setWizardData({
        step1: {
          solicitanteId:
            (cotacao.solicitanteId && String(cotacao.solicitanteId).trim()) || '—',
          solicitanteNome: cotacao.solicitanteNome?.trim() || 'Não informado',
          solicitanteEmail: cotacao.solicitanteEmail?.trim() || 'nao-informado@exemplo.com',
          dataSolicitacao: dayjs(cotacao.createdAt).format('YYYY-MM-DDTHH:mm'),
          anuncianteCampanha: cotacao.clienteNome || 'Campanha',
          agenciaId: cotacao.agenciaId ?? undefined,
          agenciaNome: cotacao.agenciaNome ?? undefined,
          clienteNome: cotacao.clienteNome ?? undefined,
          clienteSegmento: cotacao.clienteSegmento,
          urlLp: cotacao.urlLp,
          cotacaoProativa: false,
          observacoes: cotacao.observacoes ?? undefined,
        },
        step2: {
          objetivo: cotacao.objetivo,
          definicaoCampanha: ['PROGRAMATICA'],
          maturidadeDigital: cotacao.maturidadeDigital,
          aceitaModeloHibrido: cotacao.aceitaModeloHibrido,
          risco: cotacao.risco,
        } as Step2Data,
        step3: {
          budget: Number(cotacao.budget),
          dataInicio: dataInicioStr,
          dataFim: dataFimStr,
          tipoRegiao: 'NACIONAL',
        } as Step3Data,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar cotação');
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Submit = (data: Step1Data) => {
    setWizardData((prev) => ({ ...prev, step1: data }));
    setCurrentStep(2);
  };

  const handleStep2Submit = (data: Step2Data) => {
    setWizardData((prev) => ({ ...prev, step2: data }));
    setCurrentStep(3);
  };

  const handleStep3Submit = (data: Step3Data) => {
    setWizardData((prev) => ({ ...prev, step3: data }));
    setCurrentStep(4);
  };

  const handleStep4Save = (cotacaoId: string) => {
    window.location.href = `/cotacao/${cotacaoId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Carregando cotação...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a
            href="/dashboard"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-dark mb-2">
            Editar Cotação
          </h1>
          <p className="text-gray-600">
            Continue preenchendo ou edite os dados da cotação
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep === step
                        ? 'bg-primary text-white'
                        : currentStep > step
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step ? '✓' : step}
                  </div>
                  <span className="mt-2 text-xs text-gray-600 text-center">
                    {step === 1 && 'Dados do Cliente'}
                    {step === 2 && 'Objetivo'}
                    {step === 3 && 'Budget'}
                    {step === 4 && 'Resultado'}
                  </span>
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      currentStep > step ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {currentStep === 1 && wizardData.step1 && (
            <WizardStep1
              initialData={wizardData.step1}
              onSubmit={handleStep1Submit}
              onBack={() => (window.location.href = '/dashboard')}
            />
          )}
          {currentStep === 2 && wizardData.step2 && (
            <WizardStep2
              initialData={wizardData.step2}
              onSubmit={handleStep2Submit}
              onBack={() => setCurrentStep(1)}
            />
          )}
          {currentStep === 3 && wizardData.step3 && (
            <WizardStep3
              initialData={wizardData.step3}
              onSubmit={handleStep3Submit}
              onBack={() => setCurrentStep(2)}
            />
          )}
          {currentStep === 4 && (
            <WizardStep4
              dadosPassos={{
                step1: wizardData.step1!,
                step2: wizardData.step2!,
                step3: wizardData.step3!,
              }}
              onBack={() => setCurrentStep(3)}
              onSave={handleStep4Save}
            />
          )}
        </div>
      </div>
    </div>
  );
}

