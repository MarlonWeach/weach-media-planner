import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { obterUsuarioDoRequest } from '@/lib/utils/auth';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const parsePositiveInt = (value: string | null, fallback: number) => {
  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallback;
  }
  return parsedValue;
};

const parseDateBoundary = (value: string | null, endOfDay: boolean) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date;
};

export async function GET(request: NextRequest) {
  try {
    const usuario = obterUsuarioDoRequest(request.headers);
    if (!usuario || usuario.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const params = request.nextUrl.searchParams;
    const page = parsePositiveInt(params.get('page'), DEFAULT_PAGE);
    const limit = Math.min(parsePositiveInt(params.get('limit'), DEFAULT_LIMIT), MAX_LIMIT);
    const skip = (page - 1) * limit;

    const usuarioId = params.get('usuarioId');
    const campo = params.get('campo');
    const dataInicio = parseDateBoundary(params.get('dataInicio'), false);
    const dataFim = parseDateBoundary(params.get('dataFim'), true);

    const where: any = {};

    if (usuarioId) where.usuarioId = usuarioId;
    if (campo) where.campo = campo;

    if (dataInicio || dataFim) {
      where.createdAt = {};
      if (dataInicio) where.createdAt.gte = dataInicio;
      if (dataFim) where.createdAt.lte = dataFim;
    }

    const [total, logs] = await Promise.all([
      prisma.wp_LogAlteracaoPreco.count({ where }),
      prisma.wp_LogAlteracaoPreco.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          usuario: {
            select: { id: true, nome: true, email: true },
          },
        },
      }),
    ]);

    const [campos, usuarios] = await Promise.all([
      prisma.wp_LogAlteracaoPreco.findMany({
        distinct: ['campo'],
        orderBy: { campo: 'asc' },
        select: { campo: true },
      }),
      prisma.wp_LogAlteracaoPreco.findMany({
        distinct: ['usuarioId'],
        orderBy: { createdAt: 'desc' },
        include: {
          usuario: {
            select: { id: true, nome: true, email: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      logs,
      filtros: {
        campos: campos.map((item) => item.campo),
        usuarios: usuarios
          .map((item) => item.usuario)
          .filter((item): item is { id: string; nome: string; email: string } => Boolean(item)),
      },
      paginacao: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error('Erro ao listar logs de auditoria:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar logs de auditoria' },
      { status: 500 }
    );
  }
}
