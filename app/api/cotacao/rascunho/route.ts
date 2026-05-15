/**
 * API Route: Salvar Rascunho de Cotação
 * POST /api/cotacao/rascunho
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { obterUserIdDoRequest, podeAcessarCotacao } from '@/lib/utils/auth';
import { sincronizarHistoricoComMixStep4 } from '@/lib/performance/historico';
import { isIdCotacaoValido } from '@/lib/cotacao/idCotacao';
import { obterProximoIdCotacao } from '@/lib/cotacao/sequencial';
import { mergeObservacoesComStep1 } from '@/lib/cotacao/observacoesMerge';

const schemaStep4 = z.object({
  mix: z.any(),
  precos: z.any().optional(),
  estimativas: z.any().optional(),
  distribuicaoFormatos: z.any().optional(),
});

const schemaRascunho = z.object({
  cotacaoId: z
    .string()
    .min(1)
    .refine((value) => isIdCotacaoValido(value), { message: 'ID de cotação inválido' })
    .optional(),
  step1: z.any().optional(),
  step2: z.any().optional(),
  step3: z.any().optional(),
  step4: schemaStep4.optional(),
  /** JSON completo do briefing (passos 1–3); usado com step4 para não perder link de anexo etc. */
  observacoesCompletas: z.string().optional(),
  vendedorId: z.string().uuid().optional(),
});

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Preserva metadados do motor (ex.: `distribuicaoFormatos.origem`) ao sincronizar o step 4. */
function mesclarMixSugeridoStep4(
  mixAnterior: unknown,
  step4: z.infer<typeof schemaStep4>
): Prisma.InputJsonValue {
  const base: Record<string, unknown> =
    mixAnterior && typeof mixAnterior === 'object' && !Array.isArray(mixAnterior)
      ? { ...(mixAnterior as Record<string, unknown>) }
      : Array.isArray(mixAnterior)
        ? { mix: mixAnterior }
        : {};

  return {
    ...base,
    mix: step4.mix,
    precos: step4.precos ?? base.precos ?? {},
    estimativas: step4.estimativas ?? base.estimativas ?? {},
    distribuicaoFormatos: step4.distribuicaoFormatos ?? base.distribuicaoFormatos,
  } as Prisma.InputJsonValue;
}

function possuiDefinicaoCampanhaHibrida(step2: any): boolean {
  const definicao = Array.isArray(step2?.definicaoCampanha) ? step2.definicaoCampanha : [];
  return definicao.length > 1;
}

function normalizarRegiao(step3: any): string {
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
}

async function normalizarRelacionamentosStep1(step1: any) {
  const solicitanteIdInformado =
    typeof step1?.solicitanteId === 'string' ? step1.solicitanteId.trim() : '';
  const agenciaIdInformado =
    typeof step1?.agenciaId === 'string' ? step1.agenciaId.trim() : '';

  const solicitanteUuidValido = uuidRegex.test(solicitanteIdInformado);
  const agenciaUuidValido = uuidRegex.test(agenciaIdInformado);

  const [solicitante, agencia] = await Promise.all([
    solicitanteUuidValido
      ? prisma.wp_Solicitante.findUnique({
          where: { id: solicitanteIdInformado },
          select: { id: true, nome: true, email: true },
        })
      : Promise.resolve(null),
    agenciaUuidValido
      ? prisma.wp_Agencia.findUnique({
          where: { id: agenciaIdInformado },
          select: { id: true, nome: true },
        })
      : Promise.resolve(null),
  ]);

  return {
    solicitanteId: solicitante?.id ?? null,
    solicitanteNome: solicitante?.nome ?? (step1?.solicitanteNome || null),
    solicitanteEmail: solicitante?.email ?? (step1?.solicitanteEmail || null),
    agenciaId: agencia?.id ?? null,
    agenciaNome: agencia?.nome ?? (step1?.agenciaNome || null),
  };
}

export async function POST(request: NextRequest) {
  try {
    const userId = obterUserIdDoRequest(request.headers);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const dados = schemaRascunho.parse(body);

    // Se tem cotacaoId, atualiza; senão, cria nova
    if (dados.cotacaoId) {
      // Atualiza rascunho existente
      const cotacao = await prisma.wp_Cotacao.findUnique({
        where: { id: dados.cotacaoId },
      });

      if (!cotacao) {
        return NextResponse.json(
          { success: false, error: 'Cotação não encontrada' },
          { status: 404 }
        );
      }

      const temPermissao = await podeAcessarCotacao(userId, cotacao.vendedorId);
      if (!temPermissao) {
        return NextResponse.json(
          { success: false, error: 'Acesso negado' },
          { status: 403 }
        );
      }

      // Atualiza apenas campos preenchidos
      const dadosAtualizacao: any = {
        status: 'RASCUNHO',
        updatedAt: new Date(),
      };

      if (dados.step1) {
        const relacionamentos = await normalizarRelacionamentosStep1(dados.step1);
        dadosAtualizacao.clienteNome = dados.step1.clienteNome;
        dadosAtualizacao.clienteSegmento = dados.step1.clienteSegmento;
        dadosAtualizacao.urlLp = dados.step1.urlLp;
        dadosAtualizacao.observacoes = mergeObservacoesComStep1(
          cotacao.observacoes,
          dados.step1 as Record<string, unknown>
        );
        dadosAtualizacao.solicitanteId = relacionamentos.solicitanteId;
        dadosAtualizacao.solicitanteNome = relacionamentos.solicitanteNome;
        dadosAtualizacao.solicitanteEmail = relacionamentos.solicitanteEmail;
        dadosAtualizacao.agenciaId = relacionamentos.agenciaId;
        dadosAtualizacao.agenciaNome = relacionamentos.agenciaNome;
      }

      if (dados.step2) {
        if (possuiDefinicaoCampanhaHibrida(dados.step2)) {
          return NextResponse.json(
            {
              success: false,
              error:
                'Não é permitido salvar cotação híbrida. Selecione apenas um tipo de campanha.',
            },
            { status: 400 }
          );
        }
        dadosAtualizacao.objetivo = dados.step2.objetivo;
        dadosAtualizacao.maturidadeDigital = dados.step2.maturidadeDigital;
        dadosAtualizacao.risco = dados.step2.risco;
        dadosAtualizacao.aceitaModeloHibrido = dados.step2.aceitaModeloHibrido;
      }

      if (dados.step3) {
        dadosAtualizacao.budget = dados.step3.budget;
        dadosAtualizacao.dataInicio = dados.step3.dataInicio?.trim()
          ? new Date(dados.step3.dataInicio)
          : null;
        dadosAtualizacao.dataFim = dados.step3.dataFim?.trim()
          ? new Date(dados.step3.dataFim)
          : null;
        dadosAtualizacao.regiao = normalizarRegiao(dados.step3) as any;
      }

      if (dados.step4) {
        dadosAtualizacao.mixSugerido = mesclarMixSugeridoStep4(
          cotacao.mixSugerido,
          dados.step4
        );
        dadosAtualizacao.precosSugeridos = dados.step4.precos;
        dadosAtualizacao.estimativas = dados.step4.estimativas;
        if (Array.isArray(dados.step4.mix)) {
          const observacoesBase =
            typeof dados.observacoesCompletas === 'string' && dados.observacoesCompletas.trim()
              ? dados.observacoesCompletas
              : cotacao.observacoes;
          dadosAtualizacao.observacoes = sincronizarHistoricoComMixStep4({
            observacoesAtual: observacoesBase,
            mix: dados.step4.mix,
            userId,
          });
        }
      }

      const cotacaoAtualizada = await prisma.wp_Cotacao.update({
        where: { id: dados.cotacaoId },
        data: dadosAtualizacao,
      });

      return NextResponse.json({
        success: true,
        cotacao: {
          id: cotacaoAtualizada.id,
          status: cotacaoAtualizada.status,
        },
      });
    } else {
      // Cria novo rascunho
      if (!dados.step1) {
        return NextResponse.json(
          { success: false, error: 'Dados do passo 1 são obrigatórios' },
          { status: 400 }
        );
      }

      if (dados.step2 && possuiDefinicaoCampanhaHibrida(dados.step2)) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Não é permitido salvar cotação híbrida. Selecione apenas um tipo de campanha.',
          },
          { status: 400 }
        );
      }

      const relacionamentos = await normalizarRelacionamentosStep1(dados.step1);

      const novoId = await obterProximoIdCotacao();
      const novaCotacao = await prisma.wp_Cotacao.create({
        data: {
          id: novoId,
          clienteNome: dados.step1.clienteNome || 'Rascunho',
          clienteSegmento: dados.step1.clienteSegmento || 'OUTROS',
          urlLp: dados.step1.urlLp || 'https://exemplo.com',
          objetivo: dados.step2?.objetivo || 'AWARENESS',
          budget: dados.step3?.budget || 1000,
          dataInicio: dados.step3?.dataInicio?.trim()
            ? new Date(dados.step3.dataInicio)
            : null,
          dataFim: dados.step3?.dataFim?.trim()
            ? new Date(dados.step3.dataFim)
            : null,
          regiao: normalizarRegiao(dados.step3) as any,
          maturidadeDigital: dados.step2?.maturidadeDigital || 'MEDIA',
          risco: dados.step2?.risco || 'MEDIA',
          aceitaModeloHibrido: dados.step2?.aceitaModeloHibrido || false,
          observacoes: mergeObservacoesComStep1(
            null,
            dados.step1 as Record<string, unknown>
          ),
          solicitanteId: relacionamentos.solicitanteId,
          solicitanteNome: relacionamentos.solicitanteNome,
          solicitanteEmail: relacionamentos.solicitanteEmail,
          agenciaId: relacionamentos.agenciaId,
          agenciaNome: relacionamentos.agenciaNome,
          vendedorId: userId,
          mixSugerido: dados.step4?.mix || {},
          precosSugeridos: dados.step4?.precos || {},
          estimativas: dados.step4?.estimativas || {},
          status: 'RASCUNHO',
        },
      });

      return NextResponse.json({
        success: true,
        cotacao: {
          id: novaCotacao.id,
          status: novaCotacao.status,
        },
      });
    }
  } catch (error) {
    console.error('Erro ao salvar rascunho:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao salvar rascunho' },
      { status: 500 }
    );
  }
}

