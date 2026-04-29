/**
 * API Route: Criar Cotação
 * POST /api/cotacao/criar
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { calcularPrecosCotacao } from '@/lib/pricing/calculoPrecos';
import { gerarDistribuicaoBudgetPorFormato, gerarMixMidia } from '@/lib/ia/mediaPlanner';
import { gerarExplicacaoComercial } from '@/lib/ia/explainer';
import { validarPlanoMidia } from '@/lib/ia/validator';
import { obterUserIdDoRequest } from '@/lib/utils/auth';
import type { Prisma } from '@prisma/client';

const CANAIS_VALIDOS = [
  'DISPLAY_PROGRAMATICO',
  'VIDEO_PROGRAMATICO',
  'CTV',
  'AUDIO_DIGITAL',
  'SOCIAL_PROGRAMATICO',
  'CRM_MEDIA',
  'IN_LIVE',
  'CPL_CPI',
] as const;

type CanalValido = (typeof CANAIS_VALIDOS)[number];

interface ValidacaoRapida {
  avisos: Array<{ tipo: 'erro' | 'aviso' | 'sugestao'; mensagem: string; campo?: string; severidade: 'baixa' | 'media' | 'alta' }>;
  valido: boolean;
}

function normalizarCanalResposta(canal: string): CanalValido | null {
  const normalized = canal.trim().toUpperCase().replace(/\s+/g, '_');
  return (CANAIS_VALIDOS as readonly string[]).includes(normalized)
    ? (normalized as CanalValido)
    : null;
}

function filtrarERenormalizarMix(
  mix: Array<{ canal: string; percentual: number; justificativa?: string }>,
  canaisPermitidos: CanalValido[]
) {
  const setPermitidos = new Set(canaisPermitidos);
  const mixFiltrado = mix
    .map((item) => ({
      ...item,
      canal: normalizarCanalResposta(item.canal),
    }))
    .filter((item): item is { canal: CanalValido; percentual: number; justificativa?: string } => {
      const canal = item.canal;
      return canal !== null && setPermitidos.has(canal);
    });

  if (mixFiltrado.length === 0) {
    return canaisPermitidos.length > 0
      ? [{ canal: canaisPermitidos[0], percentual: 100 }]
      : [];
  }

  const soma = mixFiltrado.reduce((acc, item) => acc + item.percentual, 0);
  if (soma <= 0) {
    const percentualUniforme = 100 / mixFiltrado.length;
    return mixFiltrado.map((item) => ({ ...item, percentual: percentualUniforme }));
  }

  return mixFiltrado.map((item) => ({
    ...item,
    percentual: (item.percentual / soma) * 100,
  }));
}

const schemaCriarCotacao = z.object({
  clienteNome: z.string().min(1),
  clienteSegmento: z.enum(['AUTOMOTIVO', 'FINANCEIRO', 'VAREJO', 'IMOBILIARIO', 'SAUDE', 'EDUCACAO', 'TELECOM', 'SERVICOS', 'OUTROS']),
  urlLp: z.string().url(),
  solicitanteId: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().uuid().optional()
  ),
  solicitanteNome: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().optional()
  ),
  solicitanteEmail: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().email().optional()
  ),
  agenciaId: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().uuid().optional()
  ),
  agenciaNome: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().optional()
  ),
  objetivo: z.enum(['AWARENESS', 'CONSIDERACAO', 'LEADS', 'VENDAS']),
  budget: z.number().min(1000),
  dataInicio: z.string(),
  dataFim: z.string(),
  regiao: z.enum(['NACIONAL', 'SP_CAPITAL', 'SUDESTE_EXCETO_SP', 'SUL', 'CENTRO_OESTE', 'NORDESTE', 'NORTE', 'CIDADES_MENORES']),
  maturidadeDigital: z.enum(['BAIXA', 'MEDIA', 'ALTA']),
  risco: z.enum(['BAIXA', 'MEDIA', 'ALTA']),
  aceitaModeloHibrido: z.boolean().default(false),
  observacoes: z.string().optional(),
  vendedorId: z.string().uuid().optional(),
  canaisSelecionados: z.array(z.enum(CANAIS_VALIDOS)).optional(),
  formatosSelecionados: z
    .array(
      z.object({
        canal: z.enum(CANAIS_VALIDOS),
        formato: z.string(),
        modeloCompra: z.string(),
      })
    )
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const startMs = Date.now();
    const userId = obterUserIdDoRequest(request.headers);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const dados = schemaCriarCotacao.parse(body);

    // TODO: Buscar CPM base do banco (configuração)
    // Por enquanto, usando valor padrão
    const cpmBase = 4;

    // 1. Gera mix de mídia usando IA
    const inventariosDisponiveisPadrao = [...CANAIS_VALIDOS];
    const inventariosDisponiveis =
      dados.canaisSelecionados && dados.canaisSelecionados.length > 0
        ? dados.canaisSelecionados
        : inventariosDisponiveisPadrao;

    const permitidosSet = new Set(inventariosDisponiveis);
    const formatosDoWizard = (dados.formatosSelecionados || []).filter((f) =>
      permitidosSet.has(f.canal)
    );

    // 1-2. Executa etapas principais em paralelo (reduz latência da etapa 4)
    const [mixResultado, distribuicaoFormatos, precosCalculados] = await Promise.all([
      gerarMixMidia({
        segmento: dados.clienteSegmento,
        objetivo: dados.objetivo,
        budgetTotal: dados.budget,
        regiao: dados.regiao,
        maturidadeDigital: dados.maturidadeDigital,
        toleranciaRisco: dados.risco,
        inventariosDisponiveis: inventariosDisponiveis.map(i => i.toLowerCase()),
      }),
      gerarDistribuicaoBudgetPorFormato({
        segmento: dados.clienteSegmento,
        objetivo: dados.objetivo,
        budgetTotal: dados.budget,
        formatos: formatosDoWizard,
      }),
      calcularPrecosCotacao({
        cpmBase,
        segmento: dados.clienteSegmento,
        regiao: dados.regiao,
        budget: dados.budget,
        objetivo: dados.objetivo,
      }),
    ]);

    const mixNormalizado = filtrarERenormalizarMix(
      mixResultado.mix || [],
      inventariosDisponiveis as CanalValido[]
    );

    // 3. Calcula estimativas básicas
    const estimativas = calcularEstimativas(
      dados.budget,
      mixNormalizado,
      precosCalculados
    );

    // 4-5. Resposta imediata com fallback rápido; enriquecimento IA roda em background
    const validacao = gerarValidacaoRapida(mixNormalizado);
    const explicacaoComercial = gerarExplicacaoComercialFallback(
      dados.clienteNome,
      dados.clienteSegmento,
      dados.objetivo,
      dados.regiao
    );

    // 6. Salva no banco
    const cotacao = await prisma.wp_Cotacao.create({
      data: {
        clienteNome: dados.clienteNome,
        clienteSegmento: dados.clienteSegmento,
        urlLp: dados.urlLp,
        objetivo: dados.objetivo,
        budget: dados.budget,
        dataInicio: new Date(dados.dataInicio),
        dataFim: new Date(dados.dataFim),
        regiao: dados.regiao,
        maturidadeDigital: dados.maturidadeDigital,
        risco: dados.risco,
        aceitaModeloHibrido: dados.aceitaModeloHibrido,
        observacoes: dados.observacoes,
        solicitanteId: dados.solicitanteId,
        solicitanteNome: dados.solicitanteNome,
        solicitanteEmail: dados.solicitanteEmail,
        agenciaId: dados.agenciaId,
        agenciaNome: dados.agenciaNome,
        vendedorId: userId,
        mixSugerido: {
          ...mixResultado,
          mix: mixNormalizado,
          distribuicaoFormatos,
        } as unknown as Prisma.InputJsonValue,
        precosSugeridos: precosCalculados as unknown as Prisma.InputJsonValue,
        estimativas: estimativas as unknown as Prisma.InputJsonValue,
        status: 'RASCUNHO',
      },
    });

    // 7. Salva histórico de IA - Plano de Mídia (rápido)
    await prisma.wp_HistoricoIA.create({
      data: {
        cotacaoId: cotacao.id,
        tipo: 'PLANO_MIDIA',
        promptEnviado: JSON.stringify({
          segmento: dados.clienteSegmento,
          objetivo: dados.objetivo,
          budget: dados.budget,
        }),
        respostaIa: JSON.stringify({
          ...mixResultado,
          mix: mixNormalizado,
          distribuicaoFormatos,
        }),
        modeloUsado: 'gpt-4o-mini',
      },
    });

    // 8. Enriquecimento com IA (não bloqueante para UX do usuário)
    executarEnriquecimentoAssincrono({
      cotacaoId: cotacao.id,
      dados,
      mixNormalizado,
      estimativas,
    });

    console.info('[cotacao/criar][timing_ms]', Date.now() - startMs);

    return NextResponse.json({
      success: true,
      cotacao: {
        id: cotacao.id,
        mix: { ...mixResultado, mix: mixNormalizado, distribuicaoFormatos },
        precos: precosCalculados,
        estimativas,
        explicacaoComercial,
        validacao,
        distribuicaoFormatos,
      },
    });
  } catch (error) {
    console.error('Erro ao criar cotação:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao criar cotação' },
      { status: 500 }
    );
  }
}

function gerarValidacaoRapida(mix: Array<{ canal: string; percentual: number }>): ValidacaoRapida {
  const somaPercentuais = mix.reduce((acc, item) => acc + item.percentual, 0);
  const avisos: ValidacaoRapida['avisos'] = [];
  if (Math.abs(somaPercentuais - 100) > 0.01) {
    avisos.push({
      tipo: 'aviso',
      mensagem: `Soma do mix em ${somaPercentuais.toFixed(2)}%; o sistema ajustou automaticamente para 100%.`,
      campo: 'mix',
      severidade: 'baixa',
    });
  }
  return { avisos, valido: true };
}

function gerarExplicacaoComercialFallback(
  clienteNome: string,
  segmento: string,
  objetivo: string,
  regiao: string
): string {
  return `Plano desenvolvido para ${clienteNome} (${segmento}), com foco em ${objetivo} e execução em ${regiao}. A recomendação prioriza distribuição equilibrada de investimento por formato e canal, mantendo flexibilidade para otimizações durante a campanha.`;
}

function executarEnriquecimentoAssincrono(params: {
  cotacaoId: string;
  dados: z.infer<typeof schemaCriarCotacao>;
  mixNormalizado: Array<{ canal: string; percentual: number }>;
  estimativas: {
    impressoes: number;
    cliques: number;
    leads: number;
    cpmEstimado: number;
    cpcEstimado: number;
    cplEstimado: number;
  };
}) {
  void (async () => {
    try {
      const [validacaoIa, explicacaoIa] = await Promise.all([
        withTimeout(
          validarPlanoMidia({
            objetivo: params.dados.objetivo,
            segmento: params.dados.clienteSegmento,
            regiao: params.dados.regiao,
            budget: params.dados.budget,
            mix: params.mixNormalizado,
            estimativas: params.estimativas,
          }),
          2500
        ),
        withTimeout(
          gerarExplicacaoComercial({
            clienteNome: params.dados.clienteNome,
            segmento: params.dados.clienteSegmento,
            objetivo: params.dados.objetivo,
            regiao: params.dados.regiao,
            mix: params.mixNormalizado,
            modelosCompra: {},
            estimativas: params.estimativas,
          }),
          2500
        ),
      ]);

      const writes: Array<Promise<unknown>> = [];
      if (validacaoIa && validacaoIa.avisos.length > 0) {
        writes.push(
          prisma.wp_HistoricoIA.create({
            data: {
              cotacaoId: params.cotacaoId,
              tipo: 'VALIDACAO',
              promptEnviado: JSON.stringify({
                objetivo: params.dados.objetivo,
                segmento: params.dados.clienteSegmento,
                regiao: params.dados.regiao,
                budget: params.dados.budget,
                mix: params.mixNormalizado,
              }),
              respostaIa: JSON.stringify(validacaoIa),
              modeloUsado: 'gpt-4o-mini',
            },
          })
        );
      }
      if (typeof explicacaoIa === 'string' && explicacaoIa.trim().length > 0) {
        writes.push(
          prisma.wp_HistoricoIA.create({
            data: {
              cotacaoId: params.cotacaoId,
              tipo: 'EXPLICACAO',
              promptEnviado: JSON.stringify({
                clienteNome: params.dados.clienteNome,
                segmento: params.dados.clienteSegmento,
                objetivo: params.dados.objetivo,
                regiao: params.dados.regiao,
              }),
              respostaIa: explicacaoIa,
              modeloUsado: 'gpt-4o-mini',
            },
          })
        );
      }
      if (writes.length > 0) {
        await Promise.allSettled(writes);
      }
    } catch (error) {
      console.warn('[cotacao/criar][enriquecimento-assincrono-erro]', error);
    }
  })();
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  let timeoutHandle: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<null>((resolve) => {
    timeoutHandle = setTimeout(() => resolve(null), timeoutMs);
  });
  const result = await Promise.race([promise, timeoutPromise]);
  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
  }
  return result;
}

/**
 * Calcula estimativas básicas de impressões, cliques e leads
 */
function calcularEstimativas(
  budget: number,
  mix: Array<{ canal: string; percentual: number }>,
  precos: any
): {
  impressoes: number;
  cliques: number;
  leads: number;
  cpmEstimado: number;
  cpcEstimado: number;
  cplEstimado: number;
} {
  // Estimativas simplificadas
  // TODO: Melhorar com dados históricos e métricas reais
  
  const cpmMedio = 5; // CPM médio estimado
  const ctrMedio = 0.5; // CTR médio de 0.5%
  const taxaConversao = 2; // Taxa de conversão de 2%

  const impressoes = (budget / cpmMedio) * 1000;
  const cliques = impressoes * (ctrMedio / 100);
  const leads = cliques * (taxaConversao / 100);

  return {
    impressoes: Math.round(impressoes),
    cliques: Math.round(cliques),
    leads: Math.round(leads),
    cpmEstimado: cpmMedio,
    cpcEstimado: budget / cliques,
    cplEstimado: budget / leads,
  };
}

