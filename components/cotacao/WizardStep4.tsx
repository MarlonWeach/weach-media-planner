/**
 * Wizard Step 4: Resultado e Ajustes
 * 
 * Exibe o resultado gerado pela IA, permite ajustes de preços
 * e gera o PDF final.
 */

'use client';

import { useState, useEffect } from 'react';
import { PricingTable } from './PricingTable';
import { AlertBox } from './AlertBox';
import { EstimativasCard } from './EstimativasCard';
import { RegraGovernanca } from '@/lib/pricing/regrasGovernanca';

interface MixCanal {
  canal: string;
  percentual: number;
  justificativa?: string;
}

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
  regra?: RegraGovernanca;
}

interface FormatoSelecionado {
  canal: string;
  formato: string;
  modeloCompra: string;
}

interface WizardStep4Props {
  dadosPassos: {
    step1: any;
    step2: any;
    step3: any;
  };
  onBack: () => void;
  onSave?: (cotacaoId: string) => void;
}

export function WizardStep4({
  dadosPassos,
  onBack,
  onSave,
}: WizardStep4Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemsPlano, setItemsPlano] = useState<ItemPlanoMidia[]>([]);
  const [cotacaoId, setCotacaoId] = useState<string | null>(null);
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [erroAjuste, setErroAjuste] = useState<string | null>(null);

  const obterHeadersAutenticacao = (): HeadersInit | null => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return null;
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  // Gera a cotação ao montar o componente
  useEffect(() => {
    gerarCotacao();
  }, []);

  const gerarCotacao = async () => {
    setLoading(true);
    setError(null);

    try {
      const authHeaders = obterHeadersAutenticacao();
      if (!authHeaders) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      // TODO: Obter vendedorId do contexto de autenticação
      const vendedorId = '00000000-0000-0000-0000-000000000000'; // Placeholder

      const regiaoNormalizada = normalizarRegiaoParaMotor(dadosPassos.step3);
      const observacoesCompletas = montarObservacoesCompletas(dadosPassos);
      const canaisSelecionados = extrairCanaisSelecionados(dadosPassos.step2);
      const formatosSelecionados = extrairFormatosSelecionados(dadosPassos.step2);
      const solicitanteIdNormalizado = normalizarStringOpcional(dadosPassos.step1?.solicitanteId);
      const agenciaIdNormalizado = normalizarStringOpcional(dadosPassos.step1?.agenciaId);
      const solicitanteNomeNormalizado = normalizarStringOpcional(dadosPassos.step1?.solicitanteNome);
      const solicitanteEmailNormalizado = normalizarStringOpcional(dadosPassos.step1?.solicitanteEmail);
      const agenciaNomeNormalizado = normalizarStringOpcional(dadosPassos.step1?.agenciaNome);

      const response = await fetch('/api/cotacao/criar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          clienteNome: dadosPassos.step1.anuncianteCampanha || dadosPassos.step1.clienteNome,
          clienteSegmento: dadosPassos.step1.clienteSegmento,
          urlLp: dadosPassos.step1.urlLp,
          solicitanteId: solicitanteIdNormalizado,
          solicitanteNome: solicitanteNomeNormalizado,
          solicitanteEmail: solicitanteEmailNormalizado,
          agenciaId: agenciaIdNormalizado,
          agenciaNome: agenciaNomeNormalizado,
          objetivo: dadosPassos.step2.objetivo,
          budget: dadosPassos.step3.budget,
          dataInicio: dadosPassos.step3.dataInicio,
          dataFim: dadosPassos.step3.dataFim,
          regiao: regiaoNormalizada,
          maturidadeDigital: dadosPassos.step2.maturidadeDigital || 'MEDIA',
          risco: dadosPassos.step2.risco || 'MEDIA',
          aceitaModeloHibrido: dadosPassos.step2.aceitaModeloHibrido || false,
          observacoes: observacoesCompletas,
          vendedorId,
          canaisSelecionados,
          formatosSelecionados,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        const detalheValidacao = extrairDetalheValidacao(data);
        throw new Error(detalheValidacao || data.error || 'Erro ao gerar cotação');
      }

      const data = await response.json();
      setCotacaoId(data.cotacao.id);

      // Transforma mix e preços em items do plano
      const items = transformarEmItemsPlano(
        data.cotacao.mix,
        data.cotacao.precos,
        data.cotacao.estimativas,
        dadosPassos.step3.budget,
        formatosSelecionados,
        data.cotacao.distribuicaoFormatos
      );
      setItemsPlano(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const normalizarStringOpcional = (value: unknown): string | undefined => {
    if (typeof value !== 'string') {
      return undefined;
    }
    const normalizedValue = value.trim();
    return normalizedValue.length > 0 ? normalizedValue : undefined;
  };

  const extrairCanaisSelecionados = (step2: any): string[] => {
    const canais = new Set<string>();
    const definicoes = step2?.definicaoCampanha || [];
    const modelosProgramatica = step2?.modelosProgramatica || [];
    const modelosPerformance = step2?.modelosPerformance || [];
    const servicosMensageria = step2?.servicosMensageria || [];

    if (definicoes.includes('WHATSAPP_SMS_PUSH') || servicosMensageria.length > 0) {
      canais.add('CRM_MEDIA');
    }

    if (definicoes.includes('PERFORMANCE') || modelosPerformance.length > 0) {
      canais.add('CPL_CPI');
    }

    const canaisProgramaticaPorModelo: Record<string, string> = {
      CPM_DISPLAY_NATIVE: 'DISPLAY_PROGRAMATICO',
      CPC_DISPLAY_NATIVE: 'DISPLAY_PROGRAMATICO',
      CPM_GAMA_DSP: 'DISPLAY_PROGRAMATICO',
      DISPLAY_CPM_RETARGETING: 'DISPLAY_PROGRAMATICO',
      NATIVE_DIFERENCIADO: 'DISPLAY_PROGRAMATICO',
      SPOTIFY_LEADERBOARD: 'DISPLAY_PROGRAMATICO',
      SPOTIFY_OVERLAY: 'DISPLAY_PROGRAMATICO',
      DEEZER_DISPLAY: 'DISPLAY_PROGRAMATICO',
      CPV_15_VIDEO: 'VIDEO_PROGRAMATICO',
      CPV_30_VIDEO: 'VIDEO_PROGRAMATICO',
      YOUTUBE_BUMPER_6: 'VIDEO_PROGRAMATICO',
      YOUTUBE_30_CPV: 'VIDEO_PROGRAMATICO',
      SPOTIFY_VIDEO: 'VIDEO_PROGRAMATICO',
      DEEZER_VIDEO: 'VIDEO_PROGRAMATICO',
      CTV_OPEN: 'CTV',
      CTV_FAST_SAMSUNG: 'CTV',
      CTV_FAST_GLOBO: 'CTV',
      CTV_PHILIPS_AOC: 'CTV',
      HBO_MAX_CPCV_30: 'CTV',
      NETFLIX: 'CTV',
      DISNEY_PLUS: 'CTV',
      SPOTIFY_AUDIO: 'AUDIO_DIGITAL',
      DEEZER_AUDIO: 'AUDIO_DIGITAL',
      LINKEDIN_SPONSORED: 'SOCIAL_PROGRAMATICO',
      LINKEDIN_INMAIL: 'SOCIAL_PROGRAMATICO',
      KWAI: 'SOCIAL_PROGRAMATICO',
      TIKTOK: 'SOCIAL_PROGRAMATICO',
      FACEBOOK_INSTAGRAM_ENGAJAMENTO: 'SOCIAL_PROGRAMATICO',
      FACEBOOK_INSTAGRAM_TRAFEGO: 'SOCIAL_PROGRAMATICO',
      FACEBOOK_INSTAGRAM_LEAD_AD: 'SOCIAL_PROGRAMATICO',
      DISPLAY_GEOFENCE_3KM: 'IN_LIVE',
    };

    if (definicoes.includes('PROGRAMATICA')) {
      if (modelosProgramatica.length === 0) {
        canais.add('DISPLAY_PROGRAMATICO');
      } else {
        modelosProgramatica.forEach((modelo: string) => {
          const canal = canaisProgramaticaPorModelo[modelo];
          if (canal) canais.add(canal);
        });
      }
    }

    if (canais.size === 0) {
      canais.add('DISPLAY_PROGRAMATICO');
    }

    return Array.from(canais);
  };

  const extrairDetalheValidacao = (data: any): string | null => {
    if (!data || !Array.isArray(data.details) || data.details.length === 0) {
      return null;
    }
    const firstDetail = data.details[0];
    if (!firstDetail || typeof firstDetail !== 'object') {
      return null;
    }
    const path = Array.isArray(firstDetail.path) ? firstDetail.path.join('.') : 'campo';
    const message = typeof firstDetail.message === 'string' ? firstDetail.message : 'valor inválido';
    return `${path}: ${message}`;
  };

  const chaveFormato = (f: {
    canal: string;
    formato: string;
    modeloCompra: string;
  }): string => `${f.canal}|||${f.formato}|||${f.modeloCompra}`;

  const transformarEmItemsPlano = (
    mix: { mix: MixCanal[] },
    precos: any,
    _estimativas: any,
    budgetTotal: number,
    formatosSelecionados: FormatoSelecionado[],
    distribuicaoFormatos?: {
      formatos: Array<FormatoSelecionado & { percentual: number }>;
    } | null
  ): ItemPlanoMidia[] => {
    if (!mix?.mix) return [];
    if (formatosSelecionados.length > 0) {
      const mapaPercentuais = new Map<string, number>();
      if (distribuicaoFormatos?.formatos?.length) {
        for (const row of distribuicaoFormatos.formatos) {
          mapaPercentuais.set(chaveFormato(row), row.percentual);
        }
      }

      const comPercentual = formatosSelecionados.map((entrada) => {
        const chave = chaveFormato(entrada);
        const p = mapaPercentuais.get(chave);
        return { entrada, percentual: p };
      });

      const comDefinido = comPercentual.filter(
        (x): x is { entrada: FormatoSelecionado; percentual: number } =>
          typeof x.percentual === 'number' && !Number.isNaN(x.percentual)
      );
      const semDefinido = comPercentual.filter(
        (x) => x.percentual === undefined
      );

      let totalDefinido = comDefinido.reduce((s, x) => s + x.percentual, 0);
      if (comDefinido.length > 0 && semDefinido.length > 0) {
        const restante = Math.max(0, 100 - totalDefinido);
        const cada = restante / semDefinido.length;
        for (const x of semDefinido) {
          x.percentual = cada;
        }
        totalDefinido = comPercentual.reduce(
          (s, x) => s + (x.percentual as number),
          0
        );
      } else if (comDefinido.length === 0) {
        const n = formatosSelecionados.length;
        const percentualUniforme = 100 / n;
        for (const x of comPercentual) {
          x.percentual = percentualUniforme;
        }
        totalDefinido = 100;
      } else if (semDefinido.length === 0 && Math.abs(totalDefinido - 100) > 0.02) {
        const fator = 100 / totalDefinido;
        for (const x of comPercentual) {
          x.percentual = (x.percentual as number) * fator;
        }
        totalDefinido = 100;
      }

      return comPercentual.map(({ entrada, percentual }) => {
        const p = percentual as number;
        const valorBudget = (budgetTotal * p) / 100;
        const preco = obterPrecoCanal(entrada.canal, entrada.formato, precos);
        const regra: RegraGovernanca = {
          precoMin: preco * 0.8,
          precoAlvo: preco,
          precoMax: preco * 1.2,
          margemMinima: 20,
        };

        return {
          canal: entrada.canal,
          formato: entrada.formato,
          modeloCompra: entrada.modeloCompra,
          preco,
          precoOriginal: preco,
          percentualBudget: p,
          valorBudget,
          estimativas: calcularEstimativasItem(
            entrada.modeloCompra,
            valorBudget,
            preco
          ),
          regra,
        };
      });
    }

    const items: ItemPlanoMidia[] = [];

    mix.mix.forEach((item) => {
      const formatosDoCanal = formatosSelecionados.filter((f) => f.canal === item.canal);
      const quantidadeFormatos = formatosDoCanal.length || 1;
      const percentualPorFormato = item.percentual / quantidadeFormatos;

      const entradas =
        formatosDoCanal.length > 0
          ? formatosDoCanal
          : [
              {
                canal: item.canal,
                formato: obterFormatoCanal(item.canal),
                modeloCompra: obterModeloCompra(item.canal),
              },
            ];

      entradas.forEach((entrada) => {
        const percentual = percentualPorFormato;
        const valorBudget = (budgetTotal * percentual) / 100;
        const preco = obterPrecoCanal(item.canal, entrada.formato, precos);
        const regra: RegraGovernanca = {
          precoMin: preco * 0.8,
          precoAlvo: preco,
          precoMax: preco * 1.2,
          margemMinima: 20,
        };

        items.push({
          canal: item.canal,
          formato: entrada.formato,
          modeloCompra: entrada.modeloCompra,
          preco,
          precoOriginal: preco,
          percentualBudget: percentual,
          valorBudget,
          estimativas: calcularEstimativasItem(
            entrada.modeloCompra,
            valorBudget,
            preco
          ),
          regra,
        });
      });
    });

    return items;
  };

  const extrairFormatosSelecionados = (step2: any): FormatoSelecionado[] => {
    const formatos: FormatoSelecionado[] = [];
    const modelosProgramatica = step2?.modelosProgramatica || [];
    const modelosPerformance = step2?.modelosPerformance || [];
    const servicosMensageria = step2?.servicosMensageria || [];

    const mapaProgramatica: Record<string, FormatoSelecionado> = {
      CPM_DISPLAY_NATIVE: { canal: 'DISPLAY_PROGRAMATICO', formato: 'CPM - Display e/ou Native', modeloCompra: 'CPM' },
      CPC_DISPLAY_NATIVE: { canal: 'DISPLAY_PROGRAMATICO', formato: 'CPC - Display e/ou Native', modeloCompra: 'CPC' },
      CPM_GAMA_DSP: { canal: 'DISPLAY_PROGRAMATICO', formato: 'CPM - Gama DSP', modeloCompra: 'CPM' },
      DISPLAY_CPM_RETARGETING: { canal: 'DISPLAY_PROGRAMATICO', formato: 'Display - CPM Retargeting', modeloCompra: 'CPM' },
      NATIVE_DIFERENCIADO: { canal: 'DISPLAY_PROGRAMATICO', formato: 'Native Diferenciado', modeloCompra: 'CPM' },
      CPV_15_VIDEO: { canal: 'VIDEO_PROGRAMATICO', formato: 'CPV 15\" - Vídeo', modeloCompra: 'CPV' },
      CPV_30_VIDEO: { canal: 'VIDEO_PROGRAMATICO', formato: 'CPV 30\" - Vídeo', modeloCompra: 'CPV' },
      YOUTUBE_BUMPER_6: { canal: 'VIDEO_PROGRAMATICO', formato: 'YouTube Bumper 6\"', modeloCompra: 'CPV' },
      YOUTUBE_30_CPV: { canal: 'VIDEO_PROGRAMATICO', formato: 'YouTube 30\" CPV', modeloCompra: 'CPV' },
      SPOTIFY_VIDEO: { canal: 'VIDEO_PROGRAMATICO', formato: 'Spotify Video', modeloCompra: 'CPV' },
      DEEZER_VIDEO: { canal: 'VIDEO_PROGRAMATICO', formato: 'Deezer Video', modeloCompra: 'CPV' },
      CTV_OPEN: { canal: 'CTV', formato: 'CTV Connect TV - Open', modeloCompra: 'CPV' },
      CTV_FAST_SAMSUNG: { canal: 'CTV', formato: 'CTV Connect TV - FAST Samsung', modeloCompra: 'CPV' },
      CTV_FAST_GLOBO: { canal: 'CTV', formato: 'CTV Connect TV - FAST Globo', modeloCompra: 'CPV' },
      CTV_PHILIPS_AOC: { canal: 'CTV', formato: 'CTV Connect TV - Philips/AOC', modeloCompra: 'CPV' },
      HBO_MAX_CPCV_30: { canal: 'CTV', formato: 'HBO / MAX CPCV 30\"', modeloCompra: 'CPV' },
      NETFLIX: { canal: 'CTV', formato: 'Netflix', modeloCompra: 'CPV' },
      DISNEY_PLUS: { canal: 'CTV', formato: 'Disney+', modeloCompra: 'CPV' },
      SPOTIFY_AUDIO: { canal: 'AUDIO_DIGITAL', formato: 'Spotify Audio', modeloCompra: 'CPM' },
      DEEZER_AUDIO: { canal: 'AUDIO_DIGITAL', formato: 'Deezer Audio', modeloCompra: 'CPM' },
      LINKEDIN_SPONSORED: { canal: 'SOCIAL_PROGRAMATICO', formato: 'LinkedIn Sponsored', modeloCompra: 'CPM' },
      LINKEDIN_INMAIL: { canal: 'SOCIAL_PROGRAMATICO', formato: 'LinkedIn Inmail', modeloCompra: 'CPM' },
      KWAI: { canal: 'SOCIAL_PROGRAMATICO', formato: 'Kwai', modeloCompra: 'CPM' },
      TIKTOK: { canal: 'SOCIAL_PROGRAMATICO', formato: 'TikTok', modeloCompra: 'CPM' },
      FACEBOOK_INSTAGRAM_ENGAJAMENTO: { canal: 'SOCIAL_PROGRAMATICO', formato: 'Facebook / Instagram - Engajamento', modeloCompra: 'CPE' },
      FACEBOOK_INSTAGRAM_TRAFEGO: { canal: 'SOCIAL_PROGRAMATICO', formato: 'Facebook / Instagram - Tráfego', modeloCompra: 'CPM' },
      FACEBOOK_INSTAGRAM_LEAD_AD: { canal: 'SOCIAL_PROGRAMATICO', formato: 'Facebook / Instagram - Lead Ad', modeloCompra: 'CPM' },
      DISPLAY_GEOFENCE_3KM: { canal: 'IN_LIVE', formato: 'Display Geofence 3km', modeloCompra: 'CPM' },
      SPOTIFY_LEADERBOARD: { canal: 'DISPLAY_PROGRAMATICO', formato: 'Spotify Leaderboard', modeloCompra: 'CPM' },
      SPOTIFY_OVERLAY: { canal: 'DISPLAY_PROGRAMATICO', formato: 'Spotify Overlay', modeloCompra: 'CPM' },
      DEEZER_DISPLAY: { canal: 'DISPLAY_PROGRAMATICO', formato: 'Deezer Display', modeloCompra: 'CPM' },
    };

    modelosProgramatica.forEach((modelo: string) => {
      const formato = mapaProgramatica[modelo];
      if (formato) formatos.push(formato);
    });

    const mapaPerformance: Record<string, FormatoSelecionado> = {
      CPL_LEAD: { canal: 'CPL_CPI', formato: 'CPL - Lead', modeloCompra: 'CPL' },
      CPI_APP: { canal: 'CPL_CPI', formato: 'CPI (Instalação de App)', modeloCompra: 'CPI' },
      CLIQUE_DUPLO: { canal: 'CPL_CPI', formato: 'Clique Duplo', modeloCompra: 'CPC' },
      CPA: { canal: 'CPL_CPI', formato: 'CPA', modeloCompra: 'CPA' },
      OUTRO: { canal: 'CPL_CPI', formato: 'Outro (Performance)', modeloCompra: 'CPL' },
    };
    modelosPerformance.forEach((modelo: string) => {
      const formato = mapaPerformance[modelo];
      if (formato) formatos.push(formato);
    });

    const mapaMensageria: Record<string, FormatoSelecionado> = {
      SMS_CPD: { canal: 'CRM_MEDIA', formato: 'SMS - CPD', modeloCompra: 'CPD' },
      WHATSAPP_CPD: { canal: 'CRM_MEDIA', formato: 'WhatsApp - CPD', modeloCompra: 'CPD' },
      PUSH_CPC: { canal: 'CRM_MEDIA', formato: 'Push - CPC', modeloCompra: 'CPC' },
    };
    servicosMensageria.forEach((servico: string) => {
      const formato = mapaMensageria[servico];
      if (formato) formatos.push(formato);
    });

    return formatos;
  };

  const obterPrecoCanal = (canal: string, formato: string, precos: any): number => {
    const formatoNormalizado = formato.toLowerCase();

    if (canal === 'DISPLAY_PROGRAMATICO') {
      if (formatoNormalizado.includes('gama')) return Number(precos?.display?.gama ?? 5.75);
      if (formatoNormalizado.includes('cpm - display e/ou native')) {
        return Number(precos?.display?.cpmBase ?? 4);
      }
      if (formatoNormalizado.includes('cpc - display e/ou native')) {
        return Number(precos?.display?.cpcDisplay ?? 2.5);
      }
      if (formatoNormalizado.includes('retargeting')) return Number(precos?.display?.retargetingCpm ?? 15);
      if (formatoNormalizado.includes('native diferenciado')) return Number(precos?.display?.nativeDiferenciado ?? 28);
      if (formatoNormalizado.includes('spotify leaderboard')) return Number(precos?.display?.spotifyLeaderboard ?? 8.8);
      if (formatoNormalizado.includes('spotify overlay')) return Number(precos?.display?.spotifyOverlay ?? 72);
      if (formatoNormalizado.includes('deezer display')) return Number(precos?.display?.deezerDisplay ?? 72);
      return Number(precos?.display?.cpmBase ?? 4);
    }

    if (canal === 'VIDEO_PROGRAMATICO') {
      if (formatoNormalizado.includes('15')) return Number(precos?.video?.cpvVideo15 ?? 0.03);
      if (formatoNormalizado.includes('bumper')) return Number(precos?.video?.cpvYoutubeBumper6 ?? 0.03);
      if (formatoNormalizado.includes('youtube 30')) return Number(precos?.video?.cpvYoutube30 ?? 0.07);
      if (formatoNormalizado.includes('spotify video')) return Number(precos?.video?.cpvSpotifyVideo30 ?? 0.14);
      if (formatoNormalizado.includes('deezer video')) return Number(precos?.video?.cpvDeezerVideo30 ?? 0.1);
      return Number(precos?.video?.cpvVideo30 ?? 0.04);
    }

    if (canal === 'CTV') {
      if (formatoNormalizado.includes('globo fast')) return Number(precos?.ctv?.cpvGloboFast ?? 0.17);
      if (formatoNormalizado.includes('globoplay')) return Number(precos?.ctv?.cpvGloboPlay15 ?? 0.12);
      if (formatoNormalizado.includes('samsung')) return Number(precos?.ctv?.cpvSamsungFast ?? 0.15);
      if (formatoNormalizado.includes('philips') || formatoNormalizado.includes('aoc')) {
        return Number(precos?.ctv?.cpvPhilipsAoc ?? 0.1);
      }
      if (formatoNormalizado.includes('max') || formatoNormalizado.includes('netflix') || formatoNormalizado.includes('disney')) {
        return Number(precos?.ctv?.cpvMaxNetflixDisney ?? 1);
      }
      return Number(precos?.ctv?.cpvCtv30Open ?? 0.04);
    }

    if (canal === 'AUDIO_DIGITAL') {
      if (formatoNormalizado.includes('spotify')) return Number(precos?.audio?.spotifyAudioCpm ?? 47);
      if (formatoNormalizado.includes('deezer')) return Number(precos?.audio?.deezerAudioCpm ?? 64);
      return Number(precos?.audio?.spotifyAudioCpm ?? 47);
    }

    if (canal === 'SOCIAL_PROGRAMATICO') {
      if (formatoNormalizado.includes('linkedin sponsored')) return Number(precos?.social?.linkedinSponsored ?? 90);
      if (formatoNormalizado.includes('linkedin inmail')) return Number(precos?.social?.linkedinInmail ?? 2.8);
      if (formatoNormalizado.includes('kwai')) return Number(precos?.social?.kwai ?? 9);
      if (formatoNormalizado.includes('engajamento')) return Number(precos?.social?.fbEngajamento ?? 3);
      if (formatoNormalizado.includes('lead ad')) return Number(precos?.social?.fbLeadAd ?? 65);
      if (formatoNormalizado.includes('trafego')) return Number(precos?.social?.fbTrafego ?? 10);
      return Number(precos?.social?.fbTrafego ?? 10);
    }

    if (canal === 'CRM_MEDIA') return 0.6;
    if (canal === 'IN_LIVE') return formatoNormalizado.includes('video') ? 0.07 : 6;
    if (canal === 'CPL_CPI') return 50;
    return 5;
  };

  const obterFormatoCanal = (canal: string): string => {
    const formatos: Record<string, string> = {
      DISPLAY_PROGRAMATICO: 'Banner',
      VIDEO_PROGRAMATICO: 'Vídeo 30"',
      CTV: 'CTV 30"',
      AUDIO_DIGITAL: 'Áudio',
      SOCIAL_PROGRAMATICO: 'Feed',
      CRM_MEDIA: 'WhatsApp',
      IN_LIVE: 'Live',
      CPL_CPI: 'Landing Page',
    };
    return formatos[canal] || '-';
  };

  const obterModeloCompra = (canal: string): string => {
    const modelos: Record<string, string> = {
      DISPLAY_PROGRAMATICO: 'CPM',
      VIDEO_PROGRAMATICO: 'CPV',
      CTV: 'CPV',
      AUDIO_DIGITAL: 'CPM',
      SOCIAL_PROGRAMATICO: 'CPC',
      CRM_MEDIA: 'CPD',
      IN_LIVE: 'CPM',
      CPL_CPI: 'CPL',
    };
    return modelos[canal] || 'CPM';
  };

  const calcularEstimativasItem = (
    modeloCompra: string,
    valorBudget: number,
    preco: number
  ) => {
    if (!Number.isFinite(preco) || preco <= 0) {
      return {
        impressoes: 0,
        cliques: 0,
        leads: 0,
      };
    }

    const quantidade =
      modeloCompra === 'CPM'
        ? Math.round((valorBudget / preco) * 1000)
        : Math.round(valorBudget / preco);

    if (modeloCompra === 'CPM' || modeloCompra === 'CPV') {
      return { impressoes: quantidade, cliques: 0, leads: 0 };
    }
    if (modeloCompra === 'CPC' || modeloCompra === 'CPE') {
      return { impressoes: 0, cliques: quantidade, leads: 0 };
    }
    if (modeloCompra === 'CPL' || modeloCompra === 'CPA' || modeloCompra === 'CPI') {
      return { impressoes: 0, cliques: 0, leads: quantidade };
    }
    return { impressoes: 0, cliques: 0, leads: 0 };
  };

  const handlePriceChange = (index: number, novoPreco: number) => {
    const itemAtual = itemsPlano[index];
    if (!itemAtual) {
      return { ok: false, message: 'Item inválido para ajuste de preço.' };
    }
    if (novoPreco < itemAtual.precoOriginal) {
      return {
        ok: false,
        message: `Preço bloqueado: o mínimo para ${itemAtual.formato || itemAtual.canal} é ${itemAtual.precoOriginal.toFixed(2)}.`,
      };
    }

    setItemsPlano((prev) => {
      const novos = [...prev];
      novos[index].preco = novoPreco;
      novos[index].estimativas = calcularEstimativasItem(
        novos[index].modeloCompra,
        novos[index].valorBudget,
        novoPreco
      );
      return novos;
    });
    setErroAjuste(null);
    return { ok: true as const };
  };

  const handleBudgetPercentChange = (index: number, novoPercentual: number) => {
    if (!Number.isFinite(novoPercentual) || novoPercentual < 0) {
      return { ok: false, message: 'Percentual inválido.' };
    }

    const itensAtualizados = itemsPlano.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      return {
        ...item,
        percentualBudget: Number(novoPercentual.toFixed(2)),
      };
    });

    const somaPercentual = Number(
      itensAtualizados.reduce((acc, item) => acc + item.percentualBudget, 0).toFixed(2)
    );

    if (somaPercentual > 100) {
      return {
        ok: false,
        message: `Soma de % budget não pode ultrapassar 100%. Soma atual: ${somaPercentual.toFixed(2)}%.`,
      };
    }

    setItemsPlano(
      itensAtualizados.map((item) => ({
        ...item,
        valorBudget: (dadosPassos.step3.budget * item.percentualBudget) / 100,
        estimativas: calcularEstimativasItem(
          item.modeloCompra,
          (dadosPassos.step3.budget * item.percentualBudget) / 100,
          item.preco
        ),
      }))
    );

    const falta = Number((100 - somaPercentual).toFixed(2));
    setErroAjuste(
      falta === 0
        ? null
        : `Distribuição incompleta: faltam ${falta.toFixed(2)}% para fechar 100%.`
    );

    return { ok: true as const };
  };

  const calcularQuantidadeEntrega = (item: ItemPlanoMidia): number => {
    if (!Number.isFinite(item.preco) || item.preco <= 0) return 0;
    if (item.modeloCompra === 'CPM') {
      return Math.round((item.valorBudget / item.preco) * 1000);
    }
    return Math.round(item.valorBudget / item.preco);
  };

  const calcularEstimativasAtuais = () => {
    return itemsPlano.reduce(
      (acc, item) => {
        const quantidade = calcularQuantidadeEntrega(item);
        if (item.modeloCompra === 'CPM') acc.impressoes += quantidade;
        if (item.modeloCompra === 'CPC') acc.cliques += quantidade;
        if (item.modeloCompra === 'CPL' || item.modeloCompra === 'CPA') acc.leads += quantidade;
        return acc;
      },
      {
        impressoes: 0,
        cliques: 0,
        leads: 0,
      }
    );
  };

  const montarStep4Payload = () => {
    const estimativasAtuais = calcularEstimativasAtuais();
    return {
      mix: itemsPlano.map((item) => ({
        canal: item.canal,
        formato: item.formato,
        modeloCompra: item.modeloCompra,
        percentual: item.percentualBudget,
        valorBudget: item.valorBudget,
        precoUnitario: item.preco,
        entregaEstimada: calcularQuantidadeEntrega(item),
      })),
      precos: {},
      estimativas: {
        ...estimativasAtuais,
      },
    };
  };

  const somaPercentualAtual = Number(
    itemsPlano.reduce((acc, item) => acc + item.percentualBudget, 0).toFixed(2)
  );
  const distribuicaoCompleta = somaPercentualAtual === 100;

  const sincronizarAjustesCotacao = async () => {
    if (!cotacaoId) return;
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
        step1: dadosPassos.step1,
        step2: dadosPassos.step2,
        step3: dadosPassos.step3,
        step4: montarStep4Payload(),
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Erro ao sincronizar ajustes do plano');
    }
  };

  const handleGerarPDF = async () => {
    if (!cotacaoId) return;
    if (!distribuicaoCompleta) {
      alert('A soma de % budget deve ser 100% antes de gerar PDF.');
      return;
    }

    setGerandoPDF(true);
    try {
      await sincronizarAjustesCotacao();
      const authHeaders = obterHeadersAutenticacao();
      if (!authHeaders) throw new Error('Sessão expirada. Faça login novamente.');

      const response = await fetch(`/api/cotacao/${cotacaoId}/pdf`, {
        method: 'POST',
        headers: {
          ...authHeaders,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao gerar PDF');
      }

      const data = await response.json();
      if (data.pdfUrl) {
        // Abre o PDF em nova aba
        window.open(data.pdfUrl, '_blank');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao gerar PDF. Tente novamente.');
    } finally {
      setGerandoPDF(false);
    }
  };

  const handleSalvarRascunho = async () => {
    if (!cotacaoId) return;
    if (!distribuicaoCompleta) {
      alert('A soma de % budget deve ser 100% para salvar o rascunho.');
      return;
    }

    try {
      await sincronizarAjustesCotacao();

      alert('Rascunho salvo com sucesso!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar rascunho. Tente novamente.');
    }
  };

  const normalizarRegiaoParaMotor = (step3: any): string => {
    if (!step3?.tipoRegiao || step3.tipoRegiao === 'NACIONAL') {
      return 'NACIONAL';
    }

    if (step3.tipoRegiao === 'ESTADO') {
      const estados = step3.estadosSelecionados || [];
      if (estados.length === 1 && estados[0] === 'SP') {
        return 'SP_CAPITAL';
      }
      return 'SUDESTE_EXCETO_SP';
    }

    return 'CIDADES_MENORES';
  };

  const montarObservacoesCompletas = (dados: any): string => {
    const payload = {
      solicitacao: {
        solicitanteId: dados.step1.solicitanteId,
        solicitante: dados.step1.solicitanteNome,
        solicitanteEmail: dados.step1.solicitanteEmail,
        dataSolicitacao: dados.step1.dataSolicitacao,
        anuncianteCampanha: dados.step1.anuncianteCampanha,
        agenciaId: dados.step1.agenciaId,
        agencia: dados.step1.agenciaNome,
        cotacaoProativa: dados.step1.cotacaoProativa || false,
        observacoesGerais: dados.step1.observacoesGerais || '',
      },
      estrategia: {
        objetivo: dados.step2.objetivo,
        definicaoCampanha: dados.step2.definicaoCampanha || [],
        servicosMensageria: dados.step2.servicosMensageria || [],
        performance: {
          modelos: dados.step2.modelosPerformance || [],
          modeloOutro: dados.step2.modeloPerformanceOutro || '',
          cplCamposCadastro: dados.step2.cplCamposCadastro || '',
          cplExigiuFiltro: dados.step2.cplExigiuFiltro,
          cplQualFiltro: dados.step2.cplQualFiltro || '',
          cplConversaoLeadCompleta: dados.step2.cplConversaoLeadCompleta || '',
          veiculaOutrasRedes: dados.step2.veiculaOutrasRedes,
          veiculaQuaisRedes: dados.step2.veiculaQuaisRedes || '',
          clienteSugeriuValor: dados.step2.clienteSugeriuValor,
          clienteValorSugerido: dados.step2.clienteValorSugerido || '',
        },
        programatica: {
          modelos: dados.step2.modelosProgramatica || [],
          modeloOutro: dados.step2.modeloProgramaticaOutro || '',
          segmentacaoExigida: dados.step2.segmentacaoExigida || '',
          kpiObjetivo: dados.step2.kpiObjetivo || '',
          precisaDadosAudiencia: dados.step2.precisaDadosAudiencia,
        },
      },
      cobertura: {
        tipoRegiao: dados.step3.tipoRegiao || 'NACIONAL',
        estadosSelecionados: dados.step3.estadosSelecionados || [],
        cidades: dados.step3.cidades || '',
      },
    };

    return JSON.stringify(payload, null, 2);
  };

  const estimativasAtuais = calcularEstimativasAtuais();

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-600">Gerando plano de mídia...</p>
        <p className="text-sm text-gray-500 mt-2">
          Isso pode levar alguns segundos
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <AlertBox type="error" title="Erro ao gerar cotação" message={error} />
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={gerarCotacao}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary-dark mb-2">
          Resultado e Ajustes
        </h2>
        <p className="text-gray-600">
          Revise o plano de mídia gerado e faça ajustes se necessário
        </p>
      </div>

      {/* Estimativas */}
      {itemsPlano.length > 0 && itemsPlano[0].estimativas && (
        <div className="mb-6">
          <EstimativasCard
            estimativas={{
              impressoes: estimativasAtuais.impressoes,
              cliques: estimativasAtuais.cliques,
              leads: estimativasAtuais.leads,
              cpmEstimado:
                estimativasAtuais.impressoes > 0
                  ? dadosPassos.step3.budget / (estimativasAtuais.impressoes / 1000)
                  : 0,
              cpcEstimado:
                estimativasAtuais.cliques > 0
                  ? dadosPassos.step3.budget / estimativasAtuais.cliques
                  : 0,
              cplEstimado:
                estimativasAtuais.leads > 0
                  ? dadosPassos.step3.budget / estimativasAtuais.leads
                  : 0,
            }}
            budgetTotal={dadosPassos.step3.budget}
          />
        </div>
      )}

      {erroAjuste && (
        <AlertBox
          type="error"
          title="Ajuste pendente no plano"
          message={erroAjuste}
        />
      )}

      {/* Tabela de Preços */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Plano de Mídia
        </h3>
        <PricingTable
          items={itemsPlano}
          budgetTotal={dadosPassos.step3.budget}
          editable={true}
          onPriceChange={handlePriceChange}
          onBudgetPercentChange={handleBudgetPercentChange}
        />
      </div>

      {/* Botões de ação */}
      <div className="flex flex-col gap-3 pt-6 border-t border-gray-200 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="w-full px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors sm:w-auto"
        >
          Voltar
        </button>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={handleSalvarRascunho}
            disabled={!distribuicaoCompleta}
            className="w-full px-6 py-2 text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors sm:w-auto"
          >
            Salvar Rascunho
          </button>
          <button
            type="button"
            onClick={handleGerarPDF}
            disabled={gerandoPDF || !distribuicaoCompleta}
            className="w-full px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
          >
            {gerandoPDF ? 'Gerando PDF...' : 'Gerar PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}

