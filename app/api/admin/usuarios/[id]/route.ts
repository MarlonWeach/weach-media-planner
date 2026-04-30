import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { obterUserIdDoRequest, usuarioTemRole } from '@/lib/utils/auth';
import { mapDbRoleToUi, mapUiRoleToDb } from '@/lib/utils/roles';

const schemaAtualizarUsuario = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'COMERCIAL']).optional(),
  ativo: z.boolean().optional(),
  senha: z.string().min(6, 'Senha mínima de 6 caracteres').optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = obterUserIdDoRequest(request.headers);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado.' },
        { status: 401 }
      );
    }
    const isAdmin = await usuarioTemRole(userId, [Role.ADMIN]);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const dados = schemaAtualizarUsuario.parse(body);
    const updateData: {
      role?: Role;
      ativo?: boolean;
      senhaHash?: string;
    } = {};

    if (dados.role) {
      updateData.role = mapUiRoleToDb(dados.role);
    }
    if (typeof dados.ativo === 'boolean') {
      updateData.ativo = dados.ativo;
    }
    if (dados.senha) {
      updateData.senhaHash = await hashPassword(dados.senha);
    }

    const usuarioAtualizado = await prisma.wp_Usuario.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      usuario: {
        ...usuarioAtualizado,
        role: mapDbRoleToUi(usuarioAtualizado.role),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar usuário' },
      { status: 500 }
    );
  }
}
