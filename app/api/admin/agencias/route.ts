import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { obterUsuarioDoRequest } from '@/lib/utils/auth';

const schemaCriarAgencia = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
});

export async function GET(request: NextRequest) {
  try {
    const usuario = obterUsuarioDoRequest(request.headers);
    if (!usuario || usuario.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const agencias = await prisma.wp_Agencia.findMany({
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        ativo: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, agencias });
  } catch (error) {
    console.error('Erro ao listar agências:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar agências' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const usuario = obterUsuarioDoRequest(request.headers);
    if (!usuario || usuario.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const dados = schemaCriarAgencia.parse(body);

    const agencia = await prisma.wp_Agencia.create({
      data: {
        nome: dados.nome.trim(),
        ativo: true,
      },
    });

    return NextResponse.json({ success: true, agencia });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Já existe agência com este nome.' },
        { status: 409 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao criar agência:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar agência' },
      { status: 500 }
    );
  }
}
