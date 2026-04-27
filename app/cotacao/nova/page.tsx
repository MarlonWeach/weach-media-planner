/**
 * Página: Nova Cotação
 * 
 * Wizard de cotação em 4 passos
 */

'use client';

import { useEffect, useState } from 'react';
import { WizardStep1, Step1Data } from '@/components/cotacao/WizardStep1';
import { WizardStep2, Step2Data } from '@/components/cotacao/WizardStep2';
import { WizardStep3, Step3Data } from '@/components/cotacao/WizardStep3';
import { WizardStep4 } from '@/components/cotacao/WizardStep4';

type WizardStep = 1 | 2 | 3 | 4;

interface WizardData {
  step1?: Step1Data;
  step2?: Step2Data;
  step3?: Step3Data;
  step4?: any;
}

const uuidRegex =
  /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;

export default function NovaCotacaoPage() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [wizardData, setWizardData] = useState<WizardData>({});
  const [dadosStorage, setDadosStorage] = useState<WizardData>({});
  const [hydrated, setHydrated] = useState(false);
  const [cotacaoId, setCotacaoId] = useState<string | null>(null);
  const [salvandoRascunho, setSalvandoRascunho] = useState(false);

  const obterStorage = () => {
    if (typeof window === 'undefined') return null;
    const storageRef: any = window.localStorage;
    if (!storageRef || typeof storageRef.getItem !== 'function') return null;
    return storageRef as Storage;
  };

  useEffect(() => {
    // Nova cotação sempre inicia limpa para evitar seleção residual de sessões anteriores.
    const storage = obterStorage();
    if (!storage) {
      setHydrated(true);
      return;
    }
    storage.removeItem('cotacao-wizard-step-1');
    storage.removeItem('cotacao-wizard-step-2');
    storage.removeItem('cotacao-wizard-step-3');
    setDadosStorage({});
    setHydrated(true);
  }, []);

  const obterHeadersAutenticacao = (): HeadersInit | null => {
    const storage = obterStorage();
    if (!storage) return null;
    const token = storage.getItem('auth_token');
    if (!token) {
      return null;
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  // Salva dados no localStorage para persistência
  const saveToLocalStorage = (step: number, data: any) => {
    const storage = obterStorage();
    if (!storage) return;
    const key = `cotacao-wizard-step-${step}`;
    storage.setItem(key, JSON.stringify(data));
    setDadosStorage((prev) => {
      if (step === 1) return { ...prev, step1: data };
      if (step === 2) return { ...prev, step2: data };
      if (step === 3) return { ...prev, step3: data };
      if (step === 4) return { ...prev, step4: data };
      return prev;
    });
  };

  const sanitizarStep1Legado = (data: any) => {
    if (!data || typeof data !== 'object') return data;
    const sanitizedData = { ...data };
    if (
      typeof sanitizedData.solicitanteId === 'string' &&
      sanitizedData.solicitanteId.trim() !== '' &&
      !uuidRegex.test(sanitizedData.solicitanteId.trim())
    ) {
      sanitizedData.solicitanteId = '';
      sanitizedData.solicitanteNome = '';
      sanitizedData.solicitanteEmail = '';
    }
    if (
      typeof sanitizedData.agenciaId === 'string' &&
      sanitizedData.agenciaId.trim() !== '' &&
      !uuidRegex.test(sanitizedData.agenciaId.trim())
    ) {
      sanitizedData.agenciaId = '';
      sanitizedData.agenciaNome = '';
    }
    return sanitizedData;
  };

  const handleStep1Submit = (data: Step1Data) => {
    setWizardData((prev) => ({ ...prev, step1: data }));
    saveToLocalStorage(1, data);
    setCurrentStep(2);
  };

  const handleStep1Back = () => {
    // Se estiver no passo 1, volta para dashboard
    window.location.href = '/dashboard';
  };

  const handleStep2Submit = (data: Step2Data) => {
    setWizardData((prev) => ({ ...prev, step2: data }));
    saveToLocalStorage(2, data);
    setCurrentStep(3);
  };

  const handleStep2Back = () => {
    setCurrentStep(1);
  };

  const handleStep3Submit = (data: Step3Data) => {
    setWizardData((prev) => ({ ...prev, step3: data }));
    saveToLocalStorage(3, data);
    setCurrentStep(4);
  };

  const handleStep3Back = () => {
    setCurrentStep(2);
  };

  const handleStep4Back = () => {
    setCurrentStep(3);
  };

  const handleStep4Save = (cotacaoId: string) => {
    // Redireciona para visualização da cotação ou dashboard
    window.location.href = `/cotacao/${cotacaoId}`;
  };

  const handleSalvarRascunho = async () => {
    setSalvandoRascunho(true);
    try {
      const authHeaders = obterHeadersAutenticacao();
      if (!authHeaders) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const response = await fetch('/api/cotacao/rascunho', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          cotacaoId,
          step1: wizardData.step1 || dadosStorage.step1,
          step2: wizardData.step2 || dadosStorage.step2,
          step3: wizardData.step3 || dadosStorage.step3,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar rascunho');
      }

      const data = await response.json();
      setCotacaoId(data.cotacao.id);
      alert('Rascunho salvo com sucesso!');
    } catch (error) {
      alert('Erro ao salvar rascunho. Tente novamente.');
    } finally {
      setSalvandoRascunho(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-dark mb-2">
            Nova Cotação
          </h1>
          <p className="text-gray-600">
            Preencha os dados abaixo para gerar uma cotação completa
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

        {/* Botão Salvar Rascunho (flutuante) */}
        {hydrated && (wizardData.step1 || dadosStorage.step1) && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={handleSalvarRascunho}
              disabled={salvandoRascunho}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {salvandoRascunho ? 'Salvando...' : '💾 Salvar Rascunho'}
            </button>
          </div>
        )}

        {/* Wizard Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {currentStep === 1 && (
            <WizardStep1
              initialData={sanitizarStep1Legado(wizardData.step1 || dadosStorage.step1)}
              onSubmit={handleStep1Submit}
              onBack={handleStep1Back}
            />
          )}
          {currentStep === 2 && (
            <WizardStep2
              initialData={wizardData.step2 || dadosStorage.step2}
              onSubmit={handleStep2Submit}
              onBack={handleStep2Back}
            />
          )}
          {currentStep === 3 && (
            <WizardStep3
              initialData={wizardData.step3 || dadosStorage.step3}
              onSubmit={handleStep3Submit}
              onBack={handleStep3Back}
            />
          )}
          {currentStep === 4 && (
            <WizardStep4
              dadosPassos={{
                step1: sanitizarStep1Legado(wizardData.step1 || dadosStorage.step1),
                step2: wizardData.step2 || dadosStorage.step2,
                step3: wizardData.step3 || dadosStorage.step3,
              }}
              onBack={handleStep4Back}
              onSave={handleStep4Save}
            />
          )}
        </div>
      </div>
    </div>
  );
}

