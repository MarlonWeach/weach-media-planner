import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { obterUsuarioDoRequest } from '@/lib/utils/auth';

const schemaCriarSolicitante = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
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

    const solicitantes = await prisma.wp_Solicitante.findMany({
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, solicitantes });
  } catch (error) {
    console.error('Erro ao listar solicitantes:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar solicitantes' },
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
    const dados = schemaCriarSolicitante.parse(body);

    const solicitante = await prisma.wp_Solicitante.create({
      data: {
        nome: dados.nome.trim(),
        email: dados.email.trim().toLowerCase(),
        ativo: true,
      },
    });

    return NextResponse.json({ success: true, solicitante });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Já existe solicitante com este email.' },
        { status: 409 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao criar solicitante:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar solicitante' },
      { status: 500 }
    );
  }
}
