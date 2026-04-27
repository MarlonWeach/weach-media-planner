/**
 * API Route: Salvar Rascunho de Cotação
 * POST /api/cotacao/rascunho
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { obterUserIdDoRequest } from '@/lib/utils/auth';

const schemaRascunho = z.object({
  cotacaoId: z.string().uuid().optional(),
  step1: z.any().optional(),
  step2: z.any().optional(),
  step3: z.any().optional(),
  step4: z.any().optional(),
  vendedorId: z.string().uuid().optional(),
});

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

      // Verifica permissão
      if (cotacao.vendedorId !== userId) {
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
        dadosAtualizacao.observacoes = dados.step1.observacoes;
        dadosAtualizacao.solicitanteId = relacionamentos.solicitanteId;
        dadosAtualizacao.solicitanteNome = relacionamentos.solicitanteNome;
        dadosAtualizacao.solicitanteEmail = relacionamentos.solicitanteEmail;
        dadosAtualizacao.agenciaId = relacionamentos.agenciaId;
        dadosAtualizacao.agenciaNome = relacionamentos.agenciaNome;
      }

      if (dados.step2) {
        dadosAtualizacao.objetivo = dados.step2.objetivo;
        dadosAtualizacao.maturidadeDigital = dados.step2.maturidadeDigital;
        dadosAtualizacao.risco = dados.step2.risco;
        dadosAtualizacao.aceitaModeloHibrido = dados.step2.aceitaModeloHibrido;
      }

      if (dados.step3) {
        dadosAtualizacao.budget = dados.step3.budget;
        dadosAtualizacao.dataInicio = new Date(dados.step3.dataInicio);
        dadosAtualizacao.dataFim = new Date(dados.step3.dataFim);
        dadosAtualizacao.regiao = normalizarRegiao(dados.step3) as any;
      }

      if (dados.step4) {
        dadosAtualizacao.mixSugerido = dados.step4.mix;
        dadosAtualizacao.precosSugeridos = dados.step4.precos;
        dadosAtualizacao.estimativas = dados.step4.estimativas;
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

      const relacionamentos = await normalizarRelacionamentosStep1(dados.step1);

      const novaCotacao = await prisma.wp_Cotacao.create({
        data: {
          clienteNome: dados.step1.clienteNome || 'Rascunho',
          clienteSegmento: dados.step1.clienteSegmento || 'OUTROS',
          urlLp: dados.step1.urlLp || 'https://exemplo.com',
          objetivo: dados.step2?.objetivo || 'AWARENESS',
          budget: dados.step3?.budget || 1000,
          dataInicio: dados.step3?.dataInicio
            ? new Date(dados.step3.dataInicio)
            : new Date(),
          dataFim: dados.step3?.dataFim
            ? new Date(dados.step3.dataFim)
            : new Date(),
          regiao: normalizarRegiao(dados.step3) as any,
          maturidadeDigital: dados.step2?.maturidadeDigital || 'MEDIA',
          risco: dados.step2?.risco || 'MEDIA',
          aceitaModeloHibrido: dados.step2?.aceitaModeloHibrido || false,
          observacoes: dados.step1.observacoes,
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

