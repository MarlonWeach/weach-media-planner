/**
 * API Route: Listar Cotações
 * GET /api/cotacao/list
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { obterUserIdDoRequest } from '@/lib/utils/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = obterUserIdDoRequest(request.headers);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Busca usuário para verificar role
    const usuario = await prisma.wp_Usuario.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Parâmetros de query
    const searchParams = request.nextUrl.searchParams;
    const segmento = searchParams.get('segmento');
    const status = searchParams.get('status');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const busca = searchParams.get('busca');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    // Admin vê todas, comercial vê apenas suas
    if (usuario.role !== 'ADMIN') {
      where.vendedorId = userId;
    }

    if (segmento) {
      where.clienteSegmento = segmento;
    }

    if (status) {
      where.status = status;
    }

    if (dataInicio || dataFim) {
      where.createdAt = {};
      if (dataInicio) {
        where.createdAt.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.createdAt.lte = new Date(dataFim);
      }
    }

    if (busca) {
      where.clienteNome = {
        contains: busca,
      };
    }

    // Buscar cotações
    const [cotacoes, total] = await Promise.all([
      prisma.wp_Cotacao.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          clienteNome: true,
          clienteSegmento: true,
          budget: true,
          status: true,
          createdAt: true,
          updatedAt: true,
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
      cotacoes: cotacoes.map((cotacao) => ({
        id: cotacao.id,
        clienteNome: cotacao.clienteNome,
        clienteSegmento: cotacao.clienteSegmento,
        budget: Number(cotacao.budget),
        status: cotacao.status,
        createdAt: cotacao.createdAt,
        updatedAt: cotacao.updatedAt,
        vendedor: cotacao.vendedor,
      })),
      paginacao: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erro ao listar cotações:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao listar cotações' },
      { status: 500 }
    );
  }
}

