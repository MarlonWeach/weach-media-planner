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

    const solicitante = await prisma.wp_Solicitante.update({
      where: { id: params.id },
      data: { ativo: dados.ativo },
    });

    return NextResponse.json({ success: true, solicitante });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar solicitante:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar solicitante' },
      { status: 500 }
    );
  }
}
