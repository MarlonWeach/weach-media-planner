import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { obterUserIdDoRequest, usuarioTemRole } from '@/lib/utils/auth';
import {
  atualizarObservacoesComHistoricoPerformance,
  extrairHistoricoPerformance,
  type HistoricoPerformanceRegistro,
} from '@/lib/performance/historico';

const schemaRegistro = z.object({
  cotacaoId: z.string().uuid(),
  canal: z.string().min(1),
  formato: z.string().min(1),
  modeloCompra: z.string().min(1),
  precoTabela: z.number().min(0),
  precoFinalAplicado: z.number().min(0),
  racionalTexto: z.string().min(1),
  racionalTags: z.array(z.string().min(1)).default([]),
  motivoAjustePreco: z.string().default(''),
  origemDecisao: z.enum(['MANUAL', 'REVISAO', 'EXCECAO']).default('MANUAL'),
});

function ehCotacaoPerformance(observacoes?: string | null): boolean {
  if (!observacoes) return false;
  try {
    const payload = JSON.parse(observacoes) as {
      estrategia?: { definicaoCampanha?: string[] };
    };
    const definicao = payload?.estrategia?.definicaoCampanha || [];
    return Array.isArray(definicao) && definicao.includes('PERFORMANCE');
  } catch {
    return false;
  }
}

function flattenHistorico(params: {
  cotacao: {
    id: string;
    clienteNome: string;
    clienteSegmento: string;
    objetivo: string;
    status: string;
    budget: unknown;
    createdAt: Date;
    updatedAt: Date;
    observacoes: string | null;
    vendedor: { id: string; nome: string; email: string };
  };
}) {
  const historico = extrairHistoricoPerformance(params.cotacao.observacoes);
  return historico.registros.map((registro) => ({
    cotacaoId: params.cotacao.id,
    clienteNome: params.cotacao.clienteNome,
    clienteSegmento: params.cotacao.clienteSegmento,
    objetivo: params.cotacao.objetivo,
    status: params.cotacao.status,
    budget: Number(params.cotacao.budget),
    vendedorId: params.cotacao.vendedor.id,
    vendedorNome: params.cotacao.vendedor.nome,
    vendedorEmail: params.cotacao.vendedor.email,
    createdAt: params.cotacao.createdAt,
    updatedAt: params.cotacao.updatedAt,
    ...registro,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const userId = obterUserIdDoRequest(request.headers);
    const isAdmin = await usuarioTemRole(userId, [Role.ADMIN]);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const params = request.nextUrl.searchParams;
    const busca = (params.get('busca') || '').trim();
    const cotacaoId = (params.get('cotacaoId') || '').trim();
    const page = Math.max(1, Number(params.get('page') || 1));
    const limit = Math.min(100, Math.max(1, Number(params.get('limit') || 20)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (cotacaoId) {
      where.id = cotacaoId;
    }
    if (busca) {
      where.OR = [
        { id: { contains: busca, mode: 'insensitive' } },
        { clienteNome: { contains: busca, mode: 'insensitive' } },
      ];
    }

    const cotacoes = await prisma.wp_Cotacao.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        clienteNome: true,
        clienteSegmento: true,
        objetivo: true,
        status: true,
        budget: true,
        createdAt: true,
        updatedAt: true,
        observacoes: true,
        vendedor: { select: { id: true, nome: true, email: true } },
      },
    });

    const registros = cotacoes
      .filter((item) => ehCotacaoPerformance(item.observacoes))
      .flatMap((cotacao) => flattenHistorico({ cotacao }));

    const total = registros.length;
    const paginados = registros.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      registros: paginados,
      paginacao: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error('Erro ao listar histórico de performance:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar histórico de performance.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = obterUserIdDoRequest(request.headers);
    const isAdmin = await usuarioTemRole(userId, [Role.ADMIN]);
    if (!isAdmin || !userId) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parseResult = schemaRegistro.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const dados = parseResult.data;
    const cotacao = await prisma.wp_Cotacao.findUnique({
      where: { id: dados.cotacaoId },
      select: {
        id: true,
        observacoes: true,
      },
    });
    if (!cotacao) {
      return NextResponse.json(
        { success: false, error: 'Cotação não encontrada.' },
        { status: 404 }
      );
    }

    const novoRegistro: HistoricoPerformanceRegistro = {
      canal: dados.canal,
      formato: dados.formato,
      modeloCompra: dados.modeloCompra,
      precoTabela: dados.precoTabela,
      precoFinalAplicado: dados.precoFinalAplicado,
      racionalTexto: dados.racionalTexto,
      racionalTags: dados.racionalTags,
      motivoAjustePreco: dados.motivoAjustePreco,
      origemDecisao: dados.origemDecisao,
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: userId,
    };

    const atualizado = atualizarObservacoesComHistoricoPerformance({
      observacoesAtual: cotacao.observacoes,
      novoRegistro,
      userId,
    });

    const logs = [];
    if (
      !atualizado.registroAnterior ||
      atualizado.registroAnterior.racionalTexto !== novoRegistro.racionalTexto
    ) {
      logs.push(
        prisma.wp_LogAlteracaoPreco.create({
          data: {
            cotacaoId: dados.cotacaoId,
            usuarioId: userId,
            campo: 'PERFORMANCE_RACIONAL',
            valorAnterior: atualizado.registroAnterior?.racionalTexto || '',
            valorNovo: novoRegistro.racionalTexto,
            motivo: novoRegistro.motivoAjustePreco || 'Atualização de racional de performance',
          },
        })
      );
    }

    if (
      !atualizado.registroAnterior ||
      atualizado.registroAnterior.precoFinalAplicado !== novoRegistro.precoFinalAplicado
    ) {
      logs.push(
        prisma.wp_LogAlteracaoPreco.create({
          data: {
            cotacaoId: dados.cotacaoId,
            usuarioId: userId,
            campo: 'PERFORMANCE_PRECO_FINAL',
            valorAnterior: String(atualizado.registroAnterior?.precoFinalAplicado ?? ''),
            valorNovo: String(novoRegistro.precoFinalAplicado),
            motivo: novoRegistro.motivoAjustePreco || 'Atualização de preço final de performance',
          },
        })
      );
    }

    await prisma.$transaction([
      prisma.wp_Cotacao.update({
        where: { id: dados.cotacaoId },
        data: { observacoes: atualizado.observacoes },
      }),
      ...logs,
    ]);

    return NextResponse.json({
      success: true,
      historico: atualizado.historico,
    });
  } catch (error) {
    console.error('Erro ao salvar histórico de performance:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao salvar histórico de performance.' },
      { status: 500 }
    );
  }
}

