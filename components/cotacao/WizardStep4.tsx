/**
 * Wizard Step 4: Resultado e Ajustes
 * 
 * Exibe o resultado gerado pela IA, permite ajustes de preços
 * e gera o PDF final.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { PricingTable } from './PricingTable';
import { AlertBox } from './AlertBox';
import { EstimativasCard } from './EstimativasCard';
import { RegraGovernanca } from '@/lib/pricing/regrasGovernanca';
import {
  modeloCompraCrmPorFormato,
  PRECO_CRM_PUSH_CPC,
  PRECO_CRM_SMS_CPD,
  PRECO_CRM_WHATSAPP_CPD,
} from '@/lib/cotacao/precosMensageriaCrm';
import { formatoCpvStreamersApenasNotion } from '@/lib/cotacao/formatosPrecoNotion';
import { montarNomeArquivoPlanoMidiaXlsx } from '@/lib/cotacao/nomeArquivoPlanoMidia';
import { obterCvrPercentualCpvParaExibicao } from '@/lib/cotacao/planoMidiaTabelaComercial';

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
  /** HBO/MAX, Netflix, Disney+ ou TikTok sem D3 válido: preço manual no Notion. */
  consultaPrecoNoNotion?: boolean;
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

const CTR_DISPLAY_CPM = 0.004; // 0,40%
const CTR_SOCIAL = 0.02; // 2%
const CIDADES_GRANDES_ALIASES: Record<string, string[]> = {
  'sao paulo': ['sao paulo', 'são paulo', 'sao paulo sp', 'são paulo sp', 'sao paulo-sp', 'são paulo-sp', 'sao paulo capital', 'são paulo capital', 'sao capital', 'são capital'],
  'rio de janeiro': ['rio de janeiro', 'rio de janeiro rj', 'rio de janeiro-rj', 'rio rj', 'rio de janeiro capital', 'rio capital'],
  'belo horizonte': ['belo horizonte', 'belo horizonte mg', 'belo horizonte-mg'],
  brasilia: ['brasilia', 'brasília', 'brasilia df', 'brasília df'],
  salvador: ['salvador', 'salvador ba', 'salvador-ba'],
  fortaleza: ['fortaleza', 'fortaleza ce', 'fortaleza-ce'],
  recife: ['recife', 'recife pe', 'recife-pe'],
  'porto alegre': ['porto alegre', 'porto alegre rs', 'porto alegre-rs'],
  curitiba: ['curitiba', 'curitiba pr', 'curitiba-pr'],
  manaus: ['manaus', 'manaus am', 'manaus-am'],
  belem: ['belem', 'belém', 'belem pa', 'belém pa'],
  goiania: ['goiania', 'goiânia', 'goiania go', 'goiânia go'],
  guarulhos: ['guarulhos', 'guarulhos sp', 'guarulhos-sp'],
  campinas: ['campinas', 'campinas sp', 'campinas-sp'],
  'sao luis': ['sao luis', 'são luís', 'sao luis ma'],
  maceio: ['maceio', 'maceió', 'maceio al'],
  natal: ['natal', 'natal rn'],
  'joao pessoa': ['joao pessoa', 'joão pessoa', 'joao pessoa pb'],
  florianopolis: ['florianopolis', 'florianópolis', 'florianopolis sc'],
  vitoria: ['vitoria', 'vitória', 'vitoria es'],
  santos: ['santos', 'santos sp'],
  'sao bernardo do campo': ['sao bernardo do campo', 'são bernardo do campo', 'sbc'],
  'santo andre': ['santo andre', 'santo andré', 'santo andre sp'],
  osasco: ['osasco', 'osasco sp'],
  'ribeirao preto': ['ribeirao preto', 'ribeirão preto', 'ribeirao preto sp'],
  sorocaba: ['sorocaba', 'sorocaba sp'],
  niteroi: ['niteroi', 'niterói', 'niteroi rj'],
  'duque de caxias': ['duque de caxias', 'duque de caxias rj'],
  'nova iguacu': ['nova iguacu', 'nova iguaçu', 'nova iguacu rj'],
  'sao goncalo': ['sao goncalo', 'são gonçalo', 'sao goncalo rj'],
  teresina: ['teresina', 'teresina pi'],
  'campo grande': ['campo grande', 'campo grande ms'],
  'jaboatao dos guararapes': ['jaboatao dos guararapes', 'jaboatão dos guararapes'],
  contagem: ['contagem', 'contagem mg'],
  joinville: ['joinville', 'joinville sc'],
  uberlandia: ['uberlandia', 'uberlândia', 'uberlandia mg'],
  aracaju: ['aracaju', 'aracaju se'],
  'feira de santana': ['feira de santana', 'feira de santana ba'],
  cuiaba: ['cuiaba', 'cuiabá', 'cuiaba mt'],
  'aparecida de goiania': ['aparecida de goiania', 'aparecida de goiânia'],
  londrina: ['londrina', 'londrina pr'],
  'juiz de fora': ['juiz de fora', 'juiz de fora mg'],
  serra: ['serra', 'serra es'],
  'campos dos goytacazes': ['campos dos goytacazes', 'campos rj'],
  'belford roxo': ['belford roxo', 'belford roxo rj'],
  'vila velha': ['vila velha', 'vila velha es'],
  ananindeua: ['ananindeua', 'ananindeua pa'],
  'sao jose dos campos': ['sao jose dos campos', 'são josé dos campos', 'sjc'],
  macapa: ['macapa', 'macapá'],
  'sao joao de meriti': ['sao joao de meriti', 'são joão de meriti'],
};

const CIDADES_GRANDES_VARIACOES = new Set(
  Object.values(CIDADES_GRANDES_ALIASES)
    .flat()
    .map((cidade) => normalizarNomeCidade(cidade))
);

function normalizarNomeCidade(cidade: string): string {
  return String(cidade || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function distanciaLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + custo
      );
    }
  }
  return dp[m][n];
}

function ehCidadeGrande(nomeCidade: string): boolean {
  const cidadeNormalizada = normalizarNomeCidade(nomeCidade);
  if (!cidadeNormalizada) return false;
  if (CIDADES_GRANDES_VARIACOES.has(cidadeNormalizada)) return true;

  // Fuzzy leve para typos comuns: ex "sao paol".
  const maxDistancia = cidadeNormalizada.length <= 6 ? 1 : 2;
  for (const variacao of CIDADES_GRANDES_VARIACOES) {
    const diffTamanho = Math.abs(variacao.length - cidadeNormalizada.length);
    if (diffTamanho > maxDistancia) continue;
    if (distanciaLevenshtein(cidadeNormalizada, variacao) <= maxDistancia) {
      return true;
    }
  }
  return false;
}

interface WizardStep4Props {
  dadosPassos: {
    step1: any;
    step2: any;
    step3: any;
  };
  onBack: () => void;
  onSave?: (cotacaoId: string) => void;
  cotacaoExistente?: {
    id: string;
    mix?: Array<{
      canal?: string;
      formato?: string;
      modeloCompra?: string;
      percentual?: number;
      valorBudget?: number;
      precoUnitario?: number;
      preco?: number;
      entregaEstimada?: number;
    }>;
  } | null;
}

export function WizardStep4({
  dadosPassos,
  onBack,
  onSave,
  cotacaoExistente = null,
}: WizardStep4Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemsPlano, setItemsPlano] = useState<ItemPlanoMidia[]>([]);
  const [cotacaoId, setCotacaoId] = useState<string | null>(null);
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [baixandoExcel, setBaixandoExcel] = useState(false);
  const [erroAjuste, setErroAjuste] = useState<string | null>(null);
  /** Notificação em página (substitui `alert` do browser). */
  const [bannerFluxo, setBannerFluxo] = useState<{
    tipo: 'success' | 'warning' | 'error' | 'info';
    titulo?: string;
    mensagem: string;
    pdfHref?: string;
    /** Se true, há temporizador para `/` (cancelável ao fechar o banner). */
    redirecionaHome?: boolean;
  } | null>(null);
  const redirecionarHomeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inicializacaoExecutadaRef = useRef(false);

  const cancelarRedirecionamentoHome = () => {
    if (redirecionarHomeTimerRef.current != null) {
      clearTimeout(redirecionarHomeTimerRef.current);
      redirecionarHomeTimerRef.current = null;
    }
  };

  const agendarRedirecionamentoHome = (ms: number) => {
    cancelarRedirecionamentoHome();
    redirecionarHomeTimerRef.current = setTimeout(() => {
      redirecionarHomeTimerRef.current = null;
      window.location.href = '/';
    }, ms);
  };

  useEffect(() => {
    return () => {
      cancelarRedirecionamentoHome();
    };
  }, []);
  const definicoesCampanhaStep2 = Array.isArray(dadosPassos?.step2?.definicaoCampanha)
    ? dadosPassos.step2.definicaoCampanha
    : [];
  const temPerformance = definicoesCampanhaStep2.includes('PERFORMANCE');
  const temProgramaticaOuMensageria =
    definicoesCampanhaStep2.includes('PROGRAMATICA') ||
    definicoesCampanhaStep2.includes('WHATSAPP_SMS_PUSH');
  const ehHibridoPerformanceMidia = temPerformance && temProgramaticaOuMensageria;
  /** Só performance: sem plano tabulado neste passo. Com programática/mensageria, exibe a parte tabulada. */
  const apenasPerformanceNoWizard = temPerformance && !temProgramaticaOuMensageria;

  const obterHeadersAutenticacao = (): HeadersInit | null => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return null;
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const carregarItensSalvos = async (): Promise<boolean> => {
    if (!cotacaoExistente?.id || !Array.isArray(cotacaoExistente.mix) || cotacaoExistente.mix.length === 0) {
      return false;
    }

    const authHeaders = obterHeadersAutenticacao();
    if (!authHeaders) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    const regiaoNormalizada = normalizarRegiaoParaMotor(dadosPassos.step3);
    const pricingResponse = await fetch('/api/pricing/calcular', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        segmento: dadosPassos.step1?.clienteSegmento,
        regiao: regiaoNormalizada,
        budget: Number(dadosPassos.step3?.budget),
        objetivo: dadosPassos.step2?.objetivo,
      }),
    });
    if (!pricingResponse.ok) {
      const pricingData = await pricingResponse.json().catch(() => ({}));
      throw new Error(pricingData?.error || 'Erro ao recalcular preços para o rascunho.');
    }
    const pricingData = await pricingResponse.json();
    const precosRecalculados = pricingData?.precos || {};

    const itensRestaurados = cotacaoExistente.mix
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const canal = typeof item.canal === 'string' ? item.canal : 'DISPLAY_PROGRAMATICO';
        const formato = typeof item.formato === 'string' ? item.formato : obterFormatoCanal(canal);
        const modeloCompra =
          typeof item.modeloCompra === 'string'
            ? item.modeloCompra
            : obterModeloCompra(canal, formato);
        const percentualBudget = Number(item.percentual ?? 0);
        const valorBudget =
          Number.isFinite(Number(item.valorBudget))
            ? Number(item.valorBudget)
            : (dadosPassos.step3.budget * percentualBudget) / 100;
        const precoRecalculado = obterPrecoCanal(canal, formato, precosRecalculados);
        const consultaPrecoNoNotion =
          formatoCpvStreamersApenasNotion(formato || '') || !Number.isFinite(precoRecalculado);
        const precoBruto = consultaPrecoNoNotion
          ? 0
          : Number.isFinite(precoRecalculado)
            ? Number(precoRecalculado)
            : Number(item.precoUnitario ?? item.preco ?? 0);
        const precoSeguro = Number.isFinite(precoBruto) && precoBruto > 0 ? precoBruto : 0;
        const regra: RegraGovernanca = consultaPrecoNoNotion
          ? { precoMin: 0, precoAlvo: 0, precoMax: 1_000_000, margemMinima: 0 }
          : {
              precoMin: precoSeguro * 0.8,
              precoAlvo: precoSeguro,
              precoMax: precoSeguro * 1.2,
              margemMinima: 20,
            };

        return {
          canal,
          formato,
          modeloCompra,
          preco: precoSeguro,
          precoOriginal: precoSeguro,
          ...(consultaPrecoNoNotion ? { consultaPrecoNoNotion: true } : {}),
          percentualBudget: Number.isFinite(percentualBudget) ? percentualBudget : 0,
          valorBudget: Number.isFinite(valorBudget) ? valorBudget : 0,
          estimativas: calcularEstimativasItem(
            modeloCompra,
            Number.isFinite(valorBudget) ? valorBudget : 0,
            precoSeguro,
            formato,
            canal
          ),
          regra,
        } satisfies ItemPlanoMidia;
      });

    setCotacaoId(cotacaoExistente.id);
    setItemsPlano(itensRestaurados);
    return itensRestaurados.length > 0;
  };

  // Gera/recupera a cotação ao montar o componente
  useEffect(() => {
    if (inicializacaoExecutadaRef.current) {
      return;
    }
    inicializacaoExecutadaRef.current = true;

    void (async () => {
      try {
        const carregouSalvo = await carregarItensSalvos();
        if (carregouSalvo) {
          setLoading(false);
          return;
        }
        await gerarCotacao();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados do rascunho.');
        setLoading(false);
      }
    })();
  }, []);

  const gerarCotacao = async () => {
    setLoading(true);
    setError(null);

    try {
      const authHeaders = obterHeadersAutenticacao();
      if (!authHeaders) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

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
      DISPLAY_GEOFENCE_3KM: 'DISPLAY_PROGRAMATICO',
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
        const rawPreco = obterPrecoCanal(entrada.canal, entrada.formato, precos);
        const consultaPrecoNoNotion =
          formatoCpvStreamersApenasNotion(entrada.formato || '') || !Number.isFinite(rawPreco);
        const preco = consultaPrecoNoNotion ? 0 : rawPreco;
        const regra: RegraGovernanca = consultaPrecoNoNotion
          ? { precoMin: 0, precoAlvo: 0, precoMax: 1_000_000, margemMinima: 0 }
          : {
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
          ...(consultaPrecoNoNotion ? { consultaPrecoNoNotion: true } : {}),
          percentualBudget: p,
          valorBudget,
          estimativas: calcularEstimativasItem(
            entrada.modeloCompra,
            valorBudget,
            preco,
            entrada.formato,
            entrada.canal
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
                modeloCompra: obterModeloCompra(item.canal, obterFormatoCanal(item.canal)),
              },
            ];

      entradas.forEach((entrada) => {
        const percentual = percentualPorFormato;
        const valorBudget = (budgetTotal * percentual) / 100;
        const rawPreco = obterPrecoCanal(entrada.canal, entrada.formato, precos);
        const consultaPrecoNoNotion =
          formatoCpvStreamersApenasNotion(entrada.formato || '') || !Number.isFinite(rawPreco);
        const preco = consultaPrecoNoNotion ? 0 : rawPreco;
        const regra: RegraGovernanca = consultaPrecoNoNotion
          ? { precoMin: 0, precoAlvo: 0, precoMax: 1_000_000, margemMinima: 0 }
          : {
              precoMin: preco * 0.8,
              precoAlvo: preco,
              precoMax: preco * 1.2,
              margemMinima: 20,
            };

        items.push({
          canal: entrada.canal,
          formato: entrada.formato,
          modeloCompra: entrada.modeloCompra,
          preco,
          precoOriginal: preco,
          ...(consultaPrecoNoNotion ? { consultaPrecoNoNotion: true } : {}),
          percentualBudget: percentual,
          valorBudget,
          estimativas: calcularEstimativasItem(
            entrada.modeloCompra,
            valorBudget,
            preco,
            entrada.formato,
            entrada.canal
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
      DISPLAY_GEOFENCE_3KM: { canal: 'DISPLAY_PROGRAMATICO', formato: 'Display Geofence 3km', modeloCompra: 'CPM' },
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
      if (formatoNormalizado.includes('geofence') || formatoNormalizado.includes('display geofence')) {
        return Number(precos?.display?.geofenceDisplay3kmCpm ?? 14);
      }
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
      if (formatoCpvStreamersApenasNotion(formatoNormalizado)) {
        return Number.NaN;
      }
      if (formatoNormalizado.includes('globo fast')) return Number(precos?.ctv?.cpvGloboFast ?? 0.17);
      if (formatoNormalizado.includes('globoplay')) return Number(precos?.ctv?.cpvGloboPlay15 ?? 0.12);
      if (formatoNormalizado.includes('samsung')) return Number(precos?.ctv?.cpvSamsungFast ?? 0.15);
      if (formatoNormalizado.includes('philips') || formatoNormalizado.includes('aoc')) {
        return Number(precos?.ctv?.cpvPhilipsAoc ?? 0.1);
      }
      if (formatoNormalizado.includes('max / netflix') || formatoNormalizado.includes('disney+ / outros')) {
        return Number(precos?.ctv?.cpvMaxNetflixDisney ?? 0);
      }
      return Number(precos?.ctv?.cpvCtv30Open ?? 0.04);
    }

    if (canal === 'AUDIO_DIGITAL') {
      if (formatoNormalizado.includes('spotify')) return Number(precos?.audio?.spotifyAudioCpm ?? 47);
      if (formatoNormalizado.includes('deezer')) return Number(precos?.audio?.deezerAudioCpm ?? 64);
      return Number(precos?.audio?.spotifyAudioCpm ?? 47);
    }

    if (canal === 'SOCIAL_PROGRAMATICO') {
      if (formatoNormalizado.includes('tiktok')) {
        const v = precos?.social?.tiktokCpm;
        if (v != null && Number.isFinite(Number(v))) return Number(v);
        return Number.NaN;
      }
      if (formatoNormalizado.includes('linkedin sponsored')) return Number(precos?.social?.linkedinSponsored ?? 90);
      if (formatoNormalizado.includes('linkedin inmail')) return Number(precos?.social?.linkedinInmail ?? 2.8);
      if (formatoNormalizado.includes('kwai')) return Number(precos?.social?.kwai ?? 9);
      if (formatoNormalizado.includes('engajamento')) return Number(precos?.social?.fbEngajamento ?? 3);
      if (formatoNormalizado.includes('lead ad')) return Number(precos?.social?.fbLeadAd ?? 65);
      if (formatoNormalizado.includes('trafego')) return Number(precos?.social?.fbTrafego ?? 10);
      return Number(precos?.social?.fbTrafego ?? 10);
    }

    if (canal === 'CRM_MEDIA') {
      if (formatoNormalizado.includes('whatsapp')) {
        return Number(precos?.crm?.whatsappCpd ?? PRECO_CRM_WHATSAPP_CPD);
      }
      if (formatoNormalizado.includes('sms')) {
        return Number(precos?.crm?.smsCpd ?? PRECO_CRM_SMS_CPD);
      }
      if (formatoNormalizado.includes('push')) {
        return Number(precos?.crm?.pushCpc ?? PRECO_CRM_PUSH_CPC);
      }
      return Number(precos?.crm?.whatsappCpd ?? PRECO_CRM_WHATSAPP_CPD);
    }
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

  const obterModeloCompra = (canal: string, formato?: string): string => {
    if (canal === 'CRM_MEDIA') {
      return modeloCompraCrmPorFormato(formato);
    }
    const modelos: Record<string, string> = {
      DISPLAY_PROGRAMATICO: 'CPM',
      VIDEO_PROGRAMATICO: 'CPV',
      CTV: 'CPV',
      AUDIO_DIGITAL: 'CPM',
      SOCIAL_PROGRAMATICO: 'CPC',
      IN_LIVE: 'CPM',
      CPL_CPI: 'CPL',
    };
    return modelos[canal] || 'CPM';
  };

  const calcularEstimativasItem = (
    modeloCompra: string,
    valorBudget: number,
    preco: number,
    formato?: string,
    canal?: string
  ) => {
    if (!Number.isFinite(preco) || preco <= 0) {
      return {
        impressoes: 0,
        cliques: 0,
        leads: 0,
      };
    }

    if (modeloCompra === 'CPM') {
      const impressoes = Math.round((valorBudget / preco) * 1000);
      const cliques = Math.round(impressoes * obterCtrPorCanal(canal));
      return { impressoes, cliques, leads: 0 };
    }
    if (modeloCompra === 'CPV') {
      const completeViews = Math.round(valorBudget / preco);
      const cvr =
        (obterCvrPercentualCpvParaExibicao(canal || '', formato || '', modeloCompra) ?? 75) / 100;
      const impressoes = Math.round(completeViews / cvr);
      return { impressoes, cliques: 0, leads: 0 };
    }
    const quantidade = Math.round(valorBudget / preco);
    if (modeloCompra === 'CPC' || modeloCompra === 'CPE') {
      const ctr = obterCtrPorCanal(canal);
      const impressoes = ctr > 0 ? Math.round(quantidade / ctr) : 0;
      return { impressoes, cliques: quantidade, leads: 0 };
    }
    if (modeloCompra === 'CPL' || modeloCompra === 'CPA' || modeloCompra === 'CPI') {
      return { impressoes: 0, cliques: 0, leads: quantidade };
    }
    return { impressoes: 0, cliques: 0, leads: 0 };
  };

  const obterCtrPorCanal = (canal?: string): number => {
    if (canal === 'SOCIAL_PROGRAMATICO') {
      return CTR_SOCIAL;
    }
    return CTR_DISPLAY_CPM;
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
        novoPreco,
        novos[index].formato,
        novos[index].canal
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
          item.preco,
          item.formato,
          item.canal
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
        acc.impressoes += item.estimativas?.impressoes || 0;
        acc.cliques += item.estimativas?.cliques || 0;
        acc.leads += item.estimativas?.leads || 0;
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
    const cpmEstimado =
      estimativasAtuais.impressoes > 0
        ? dadosPassos.step3.budget / (estimativasAtuais.impressoes / 1000)
        : 0;
    const cpcEstimado =
      estimativasAtuais.cliques > 0
        ? dadosPassos.step3.budget / estimativasAtuais.cliques
        : 0;
    const cplEstimado =
      estimativasAtuais.leads > 0
        ? dadosPassos.step3.budget / estimativasAtuais.leads
        : 0;

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
        cpmEstimado,
        cpcEstimado,
        cplEstimado,
      },
    };
  };

  const somaPercentualAtual = Number(
    itemsPlano.reduce((acc, item) => acc + item.percentualBudget, 0).toFixed(2)
  );
  const distribuicaoCompleta = apenasPerformanceNoWizard ? true : somaPercentualAtual === 100;

  const indicesPlanoVisivel = ehHibridoPerformanceMidia
    ? itemsPlano
        .map((item, index) => (item.canal === 'CPL_CPI' ? null : index))
        .filter((i): i is number => i !== null)
    : itemsPlano.map((_, index) => index);

  const itensVisiveisNoPasso4 = indicesPlanoVisivel.map((i) => itemsPlano[i]);

  const calcularEstimativasSobreItens = (itens: ItemPlanoMidia[]) =>
    itens.reduce(
      (acc, item) => {
        acc.impressoes += item.estimativas?.impressoes || 0;
        acc.cliques += item.estimativas?.cliques || 0;
        acc.leads += item.estimativas?.leads || 0;
        return acc;
      },
      { impressoes: 0, cliques: 0, leads: 0 }
    );

  const estimativasParaExibicao = ehHibridoPerformanceMidia
    ? calcularEstimativasSobreItens(itensVisiveisNoPasso4)
    : calcularEstimativasAtuais();

  const budgetParaEstimativasCard = ehHibridoPerformanceMidia
    ? itensVisiveisNoPasso4.reduce((acc, item) => acc + item.valorBudget, 0)
    : dadosPassos.step3.budget;

  const resolverIndicePlanoReal = (indexVisivel: number) => indicesPlanoVisivel[indexVisivel] ?? -1;

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
        step4: montarStep4Payload(),
        observacoesCompletas: montarObservacoesCompletas(dadosPassos),
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Erro ao sincronizar ajustes do plano');
    }
  };

  const handleBaixarExcelPlano = async () => {
    if (!cotacaoId) return;
    setBaixandoExcel(true);
    setBannerFluxo(null);
    try {
      await sincronizarAjustesCotacao();
      const authHeaders = obterHeadersAutenticacao();
      if (!authHeaders) throw new Error('Sessão expirada. Faça login novamente.');
      const response = await fetch(`/api/cotacao/${cotacaoId}/excel`, {
        method: 'GET',
        headers: { ...authHeaders },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          typeof data.error === 'string' ? data.error : 'Erro ao baixar o Excel do plano.'
        );
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = montarNomeArquivoPlanoMidiaXlsx(
        dadosPassos.step1.anuncianteCampanha || dadosPassos.step1.clienteNome || 'campanha',
        cotacaoId
      );
      anchor.click();
      URL.revokeObjectURL(url);

      const emailResponse = await fetch(`/api/cotacao/${cotacaoId}/plano-email`, {
        method: 'POST',
        headers: { ...authHeaders },
      });
      const emailData = await emailResponse.json().catch(() => ({}));
      if (!emailResponse.ok) {
        setBannerFluxo({
          tipo: 'warning',
          titulo: 'Plano baixado',
          mensagem:
            typeof emailData.error === 'string'
              ? `O Excel foi baixado, mas o envio por e-mail falhou: ${emailData.error}`
              : 'O Excel foi baixado, mas não foi possível enviar a cotação por e-mail.',
        });
        return;
      }
      if (emailData.emailEnviado === false) {
        setBannerFluxo({
          tipo: 'warning',
          titulo: 'Plano baixado',
          mensagem:
            'O Excel foi baixado. O e-mail operacional não foi disparado (regra de envio ou destinatários).',
        });
        return;
      }
      setBannerFluxo({
        tipo: 'success',
        titulo: 'Plano baixado',
        mensagem: 'O Excel foi baixado e a cotação foi enviada por e-mail.',
      });
    } catch (err) {
      setBannerFluxo({
        tipo: 'error',
        titulo: 'Download Excel',
        mensagem: err instanceof Error ? err.message : 'Não foi possível baixar o Excel.',
      });
    } finally {
      setBaixandoExcel(false);
    }
  };

  const handleGerarPDF = async () => {
    if (!cotacaoId) return;
    if (!apenasPerformanceNoWizard && !distribuicaoCompleta) {
      setBannerFluxo({
        tipo: 'warning',
        titulo: 'Distribuição incompleta',
        mensagem: 'A soma de % budget deve ser 100% antes de enviar a cotação.',
      });
      return;
    }

    const esperaPdfPlanoNaResposta = !apenasPerformanceNoWizard;

    setGerandoPDF(true);
    setBannerFluxo(null);
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
      let pdfHref: string | undefined;
      if (data.pdfUrl && typeof window !== 'undefined') {
        pdfHref =
          typeof data.pdfUrl === 'string' && data.pdfUrl.startsWith('http')
            ? data.pdfUrl
            : `${window.location.origin}${data.pdfUrl}`;
        /** Vários browsers devolvem `null` mesmo com a aba aberta (p.ex. noopener + PDF). Não inferir falha. */
        window.open(pdfHref, '_blank', 'noopener,noreferrer');
      }

      const tituloSucesso = temPerformance
        ? 'Cotação enviada'
        : 'Cotação enviada com sucesso';

      const mensagemPerformance =
        data.message || 'A cotação foi registada e segue o fluxo interno definido.';

      if (esperaPdfPlanoNaResposta && pdfHref) {
        setBannerFluxo({
          tipo: 'success',
          titulo: tituloSucesso,
          mensagem:
            'O PDF do plano foi pedido ao navegador (normalmente numa nova aba). O mesmo plano segue em Excel anexo ao e-mail operacional. Se não vir o separador ou a aba ficar em branco por uns segundos, use o link abaixo — a cotação já ficou registada.',
          pdfHref,
          redirecionaHome: true,
        });
      } else {
        setBannerFluxo({
          tipo: 'success',
          titulo: tituloSucesso,
          mensagem: temPerformance ? mensagemPerformance : 'A cotação foi registada com sucesso.',
          redirecionaHome: true,
        });
      }

      const delayRedirect = esperaPdfPlanoNaResposta && pdfHref ? 45000 : 35000;
      agendarRedirecionamentoHome(delayRedirect);
    } catch (err) {
      cancelarRedirecionamentoHome();
      setBannerFluxo({
        tipo: 'error',
        titulo: 'Não foi possível concluir o envio',
        mensagem: err instanceof Error ? err.message : 'Erro ao gerar PDF. Tente novamente.',
      });
    } finally {
      setGerandoPDF(false);
    }
  };

  const handleSalvarRascunho = async () => {
    if (!cotacaoId) return;
    if (!distribuicaoCompleta) {
      setBannerFluxo({
        tipo: 'warning',
        titulo: 'Distribuição incompleta',
        mensagem: 'A soma de % budget deve ser 100% para salvar o rascunho.',
      });
      return;
    }

    setBannerFluxo(null);
    try {
      await sincronizarAjustesCotacao();

      setBannerFluxo({
        tipo: 'success',
        titulo: 'Rascunho guardado',
        mensagem: 'As alterações ao plano foram sincronizadas.',
      });
    } catch (err) {
      setBannerFluxo({
        tipo: 'error',
        titulo: 'Erro ao guardar',
        mensagem: err instanceof Error ? err.message : 'Erro ao salvar rascunho. Tente novamente.',
      });
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

    const cidadesInformadas = String(step3?.cidades || '')
      .split(',')
      .map((cidade: string) => cidade.trim())
      .filter(Boolean);

    const existeCidadeGrande = cidadesInformadas.some((cidade: string) => ehCidadeGrande(cidade));

    // No modelo atual do motor:
    // - SP_CAPITAL representa bucket de "cidades grandes" (CPM base 8)
    // - CIDADES_MENORES representa bucket de "cidades pequenas" (CPM base 9)
    return existeCidadeGrande ? 'SP_CAPITAL' : 'CIDADES_MENORES';
  };

  const montarObservacoesCompletas = (dados: any): string => {
    const payload = {
      solicitacao: {
        solicitanteId: dados.step1.solicitanteId,
        solicitante: dados.step1.solicitanteNome,
        solicitanteEmail: dados.step1.solicitanteEmail,
        dataSolicitacao: dados.step1.dataSolicitacao,
        anuncianteCampanha: dados.step1.anuncianteCampanha,
        urlLp: dados.step1.urlLp,
        agenciaId: dados.step1.agenciaId,
        agencia: dados.step1.agenciaNome,
        cotacaoProativa: dados.step1.cotacaoProativa || false,
        anexoDriveLink: dados.step1.anexoDriveLink || '',
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
          formatosPretendidos: dados.step2.formatosPretendidos || '',
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

  const exibirMetricasLeads = ['LEADS', 'VENDAS'].includes(
    String(dadosPassos?.step2?.objetivo || '')
  );

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
    <>
      {bannerFluxo && (
        <div
          className="fixed inset-x-0 top-0 z-[100] flex justify-center px-3 pt-3 sm:pt-4 pointer-events-none print:hidden"
          role="status"
          aria-live="polite"
        >
          <div className="pointer-events-auto w-full max-w-2xl rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
            <AlertBox
              type={bannerFluxo.tipo}
              title={bannerFluxo.titulo}
              message={bannerFluxo.mensagem}
              onDismiss={() => {
                const irParaInicio = Boolean(bannerFluxo.redirecionaHome);
                cancelarRedirecionamentoHome();
                setBannerFluxo(null);
                if (irParaInicio) {
                  window.location.href = '/';
                }
              }}
            />
            {bannerFluxo.pdfHref ? (
              <p className="mt-3 pl-9 text-sm">
                <a
                  href={bannerFluxo.pdfHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  Abrir ou reabrir o PDF do plano
                </a>
              </p>
            ) : null}
            {bannerFluxo.redirecionaHome ? (
              <p className="mt-2 pl-9 text-xs text-gray-500">
                Será redirecionado para o início em até cerca de um minuto. Ao fechar este aviso, o redirecionamento
                para o início ocorre na hora.
              </p>
            ) : null}
          </div>
        </div>
      )}
      <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary-dark mb-2">
          Resultado e Ajustes
        </h2>
        <p className="text-gray-600">
          {apenasPerformanceNoWizard
            ? 'Clique em Enviar Cotação para receber o plano de mídia.'
            : ehHibridoPerformanceMidia
              ? 'Há performance e veiculação programática ou mensageria: a parte de performance segue para análise interna; revise e ajuste o plano tabulado da programática abaixo.'
              : 'Revise o plano de mídia gerado e faça ajustes se necessário'}
        </p>
      </div>

      {/* Estimativas */}
      {!apenasPerformanceNoWizard && itemsPlano.length > 0 && itemsPlano[0].estimativas && (
        <div className="mb-6">
          <EstimativasCard
            estimativas={{
              impressoes: estimativasParaExibicao.impressoes,
              cliques: estimativasParaExibicao.cliques,
              leads: estimativasParaExibicao.leads,
              cpmEstimado:
                estimativasParaExibicao.impressoes > 0
                  ? budgetParaEstimativasCard / (estimativasParaExibicao.impressoes / 1000)
                  : 0,
              cpcEstimado:
                estimativasParaExibicao.cliques > 0
                  ? budgetParaEstimativasCard / estimativasParaExibicao.cliques
                  : 0,
              cplEstimado:
                estimativasParaExibicao.leads > 0
                  ? budgetParaEstimativasCard / estimativasParaExibicao.leads
                  : 0,
              exibirMetricasLeads,
            }}
            budgetTotal={budgetParaEstimativasCard}
          />
        </div>
      )}

      {!apenasPerformanceNoWizard && erroAjuste && (
        <AlertBox
          type="error"
          title="Ajuste pendente no plano"
          message={erroAjuste}
        />
      )}

      {/* Tabela de Preços */}
      {!apenasPerformanceNoWizard && (
        <div>
          {ehHibridoPerformanceMidia && (
            <AlertBox
              type="info"
              title="Cotação híbrida (performance + programática)"
              message={
                'A parte de performance (ex.: CPL/CPI) não é exibida como plano fechado aqui, pois depende de respostas e da validação interna. Abaixo está somente o plano tabulado da programática e/ou mensageria (linhas CPL/CPI de performance foram omitidas da tabela).'
              }
            />
          )}
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Plano de Mídia
            {ehHibridoPerformanceMidia ? ' — programática / mensageria' : ''}
          </h3>
          <PricingTable
            items={itensVisiveisNoPasso4}
            budgetTotal={dadosPassos.step3.budget}
            editable={true}
            exibirMetricasLeads={exibirMetricasLeads}
            onPriceChange={(indexVisivel, novoPreco) => {
              const realIndex = resolverIndicePlanoReal(indexVisivel);
              if (realIndex < 0) {
                return { ok: false, message: 'Linha inválida.' };
              }
              return handlePriceChange(realIndex, novoPreco);
            }}
            onBudgetPercentChange={(indexVisivel, novoPercentual) => {
              const realIndex = resolverIndicePlanoReal(indexVisivel);
              if (realIndex < 0) {
                return { ok: false, message: 'Linha inválida.' };
              }
              return handleBudgetPercentChange(realIndex, novoPercentual);
            }}
          />
        </div>
      )}

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
          {!apenasPerformanceNoWizard && cotacaoId ? (
            <button
              type="button"
              onClick={() => void handleBaixarExcelPlano()}
              disabled={baixandoExcel || !distribuicaoCompleta}
              className="w-full px-6 py-2 text-primary-dark border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
            >
              {baixandoExcel ? 'Gerando Excel...' : 'Baixar plano (.xlsx)'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleGerarPDF}
            disabled={gerandoPDF || !distribuicaoCompleta}
            className="w-full px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
          >
            {gerandoPDF ? 'Enviando cotação...' : 'Enviar cotação'}
          </button>
        </div>
      </div>
      </div>
    </>
  );
}

