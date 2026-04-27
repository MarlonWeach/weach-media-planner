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

    const mixResultado = await gerarMixMidia({
      segmento: dados.clienteSegmento,
      objetivo: dados.objetivo,
      budgetTotal: dados.budget,
      regiao: dados.regiao,
      maturidadeDigital: dados.maturidadeDigital,
      toleranciaRisco: dados.risco,
      inventariosDisponiveis: inventariosDisponiveis.map(i => i.toLowerCase()),
    });
    const mixNormalizado = filtrarERenormalizarMix(
      mixResultado.mix || [],
      inventariosDisponiveis as CanalValido[]
    );

    const permitidosSet = new Set(inventariosDisponiveis);
    const formatosDoWizard = (dados.formatosSelecionados || []).filter((f) =>
      permitidosSet.has(f.canal)
    );

    const distribuicaoFormatos = await gerarDistribuicaoBudgetPorFormato({
      segmento: dados.clienteSegmento,
      objetivo: dados.objetivo,
      budgetTotal: dados.budget,
      formatos: formatosDoWizard,
    });

    // 2. Calcula preços usando motor determinístico
    const precosCalculados = await calcularPrecosCotacao({
      cpmBase,
      segmento: dados.clienteSegmento,
      regiao: dados.regiao,
      budget: dados.budget,
      objetivo: dados.objetivo,
    });

    // 3. Calcula estimativas básicas
    const estimativas = calcularEstimativas(
      dados.budget,
      mixNormalizado,
      precosCalculados
    );

    // 4. Valida plano de mídia
    const validacao = await validarPlanoMidia({
      objetivo: dados.objetivo,
      segmento: dados.clienteSegmento,
      regiao: dados.regiao,
      budget: dados.budget,
      mix: mixNormalizado,
      estimativas,
    });

    // 5. Gera explicação comercial
    const explicacaoComercial = await gerarExplicacaoComercial({
      clienteNome: dados.clienteNome,
      segmento: dados.clienteSegmento,
      objetivo: dados.objetivo,
      regiao: dados.regiao,
      mix: mixNormalizado,
      modelosCompra: {},
      estimativas,
    });

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

    // 7. Salva histórico de IA - Plano de Mídia
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

    // 8. Salva histórico de validação (se houver avisos)
    if (validacao.avisos.length > 0) {
      await prisma.wp_HistoricoIA.create({
        data: {
          cotacaoId: cotacao.id,
          tipo: 'VALIDACAO',
          promptEnviado: JSON.stringify({
            objetivo: dados.objetivo,
            segmento: dados.clienteSegmento,
            regiao: dados.regiao,
            budget: dados.budget,
            mix: mixNormalizado,
          }),
          respostaIa: JSON.stringify(validacao),
          modeloUsado: 'gpt-4o-mini',
        },
      });
    }

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

