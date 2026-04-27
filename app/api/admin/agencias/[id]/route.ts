import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { obterUsuarioDoRequest } from '@/lib/utils/auth';

const schemaAtualizarStatus = z.object({
  ativo: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const usuario = obterUsuarioDoRequest(request.headers);
    if (!usuario || usuario.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const dados = schemaAtualizarStatus.parse(body);

    const agencia = await prisma.wp_Agencia.update({
      where: { id: params.id },
      data: { ativo: dados.ativo },
    });

    return NextResponse.json({ success: true, agencia });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar agência:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar agência' },
      { status: 500 }
    );
  }
}
