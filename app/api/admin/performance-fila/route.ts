import { NextRequest, NextResponse } from 'next/server';
import { Role, StatusCotacao } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { obterUserIdDoRequest, usuarioTemRole } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

function extrairDefinicaoCampanha(observacoes?: string | null): string[] {
  if (!observacoes) return [];
  try {
    const payload = JSON.parse(observacoes) as {
      estrategia?: { definicaoCampanha?: string[] };
    };
    return Array.isArray(payload?.estrategia?.definicaoCampanha)
      ? payload.estrategia!.definicaoCampanha!
      : [];
  } catch {
    return [];
  }
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
    const page = Math.max(1, Number(params.get('page') || 1));
    const limit = Math.min(100, Math.max(1, Number(params.get('limit') || 20)));
    const skip = (page - 1) * limit;

    const where: any = {
      status: StatusCotacao.AGUARDANDO_APROVACAO,
      observacoes: {
        contains: 'PERFORMANCE',
      },
    };
    if (busca) {
      where.OR = [
        { id: { contains: busca, mode: 'insensitive' } },
        { clienteNome: { contains: busca, mode: 'insensitive' } },
      ];
    }

    const [cotacoes, total] = await Promise.all([
      prisma.wp_Cotacao.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          clienteNome: true,
          clienteSegmento: true,
          objetivo: true,
          budget: true,
          createdAt: true,
          updatedAt: true,
          status: true,
          solicitanteNome: true,
          solicitanteEmail: true,
          vendedor: {
            select: { nome: true, email: true },
          },
          observacoes: true,
        },
      }),
      prisma.wp_Cotacao.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      fila: cotacoes.map((item) => ({
        id: item.id,
        clienteNome: item.clienteNome,
        clienteSegmento: item.clienteSegmento,
        objetivo: item.objetivo,
        budget: Number(item.budget),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        status: item.status,
        solicitanteNome: item.solicitanteNome || 'Não informado',
        solicitanteEmail: item.solicitanteEmail || 'Não informado',
        vendedorNome: item.vendedor.nome,
        vendedorEmail: item.vendedor.email,
        definicaoCampanha: extrairDefinicaoCampanha(item.observacoes),
      })),
      paginacao: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error('Erro ao listar fila de performance:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar fila de performance.' },
      { status: 500 }
    );
  }
}

