import { NextRequest, NextResponse } from 'next/server';
import { Role, StatusCotacao } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { obterUserIdDoRequest, usuarioTemRole } from '@/lib/utils/auth';

const STATUS_ENVIO = [
  StatusCotacao.ENVIADA,
  StatusCotacao.APROVADA,
  StatusCotacao.RECUSADA,
  StatusCotacao.EM_EXECUCAO,
  StatusCotacao.FINALIZADA,
  StatusCotacao.AGUARDANDO_APROVACAO,
] as const;

function extrairDefinicaoCampanha(observacoes?: string | null): string {
  if (!observacoes) return 'N/A';
  try {
    const payload = JSON.parse(observacoes) as {
      estrategia?: { definicaoCampanha?: string[] };
    };
    const lista = payload?.estrategia?.definicaoCampanha || [];
    if (!Array.isArray(lista) || lista.length === 0) return 'N/A';
    return lista.join(', ');
  } catch {
    return 'N/A';
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
    const status = params.get('status');
    const busca = params.get('busca');
    const dataInicio = params.get('dataInicio');
    const dataFim = params.get('dataFim');
    const page = Math.max(1, Number(params.get('page') || 1));
    const limit = Math.min(100, Math.max(1, Number(params.get('limit') || 20)));
    const skip = (page - 1) * limit;

    const where: any = {
      status: status && status.length > 0
        ? status
        : { in: STATUS_ENVIO as readonly StatusCotacao[] },
    };

    if (busca && busca.trim().length > 0) {
      where.OR = [
        { id: { contains: busca.trim(), mode: 'insensitive' } },
        { clienteNome: { contains: busca.trim(), mode: 'insensitive' } },
      ];
    }

    if (dataInicio || dataFim) {
      where.updatedAt = {};
      if (dataInicio) {
        where.updatedAt.gte = new Date(`${dataInicio}T00:00:00.000Z`);
      }
      if (dataFim) {
        where.updatedAt.lte = new Date(`${dataFim}T23:59:59.999Z`);
      }
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
          objetivo: true,
          status: true,
          updatedAt: true,
          createdAt: true,
          budget: true,
          solicitanteNome: true,
          solicitanteEmail: true,
          agenciaNome: true,
          observacoes: true,
          pdfUrl: true,
          vendedor: {
            select: {
              nome: true,
              email: true,
            },
          },
        },
      }),
      prisma.wp_Cotacao.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      envios: cotacoes.map((cotacao) => ({
        id: cotacao.id,
        clienteNome: cotacao.clienteNome,
        objetivo: cotacao.objetivo,
        definicaoCampanha: extrairDefinicaoCampanha(cotacao.observacoes),
        status: cotacao.status,
        dataEnvio: cotacao.updatedAt,
        dataCriacao: cotacao.createdAt,
        budget: Number(cotacao.budget),
        solicitanteNome: cotacao.solicitanteNome || 'Não informado',
        solicitanteEmail: cotacao.solicitanteEmail || 'Não informado',
        agenciaNome: cotacao.agenciaNome || 'Não informada',
        vendedorNome: cotacao.vendedor.nome,
        vendedorEmail: cotacao.vendedor.email,
        pdfUrl: cotacao.pdfUrl,
      })),
      filtros: {
        status: STATUS_ENVIO,
      },
      paginacao: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error('Erro ao listar histórico de envios:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar histórico de envios' },
      { status: 500 }
    );
  }
}
