import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth/session';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { mensagemSenhaMinima, SENHA_MIN_CARACTERES } from '@/lib/auth/passwordPolicy';

const schemaChangePassword = z
  .object({
    senhaAtual: z.string().optional().default(''),
    novaSenha: z.string().min(SENHA_MIN_CARACTERES, mensagemSenhaMinima()),
    confirmarNovaSenha: z.string().min(1, 'Confirmação da nova senha é obrigatória'),
  })
  .refine((value) => value.novaSenha === value.confirmarNovaSenha, {
    message: 'Confirmação da nova senha não confere',
    path: ['confirmarNovaSenha'],
  });

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token não fornecido' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const dados = schemaChangePassword.parse(body);

    const usuario = await prisma.wp_Usuario.findUnique({
      where: { id: payload.userId },
      select: { id: true, ativo: true, senhaHash: true, senhaLocalConfigurada: true },
    });

    if (!usuario || !usuario.ativo) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado ou inativo' },
        { status: 404 }
      );
    }

    if (usuario.senhaLocalConfigurada) {
      const atual = dados.senhaAtual.trim();
      if (!atual) {
        return NextResponse.json(
          { success: false, error: 'Senha atual é obrigatória' },
          { status: 400 }
        );
      }
      const senhaAtualValida = await verifyPassword(atual, usuario.senhaHash);
      if (!senhaAtualValida) {
        return NextResponse.json(
          { success: false, error: 'Senha atual inválida' },
          { status: 400 }
        );
      }
    }

    const novoHash = await hashPassword(dados.novaSenha);
    await prisma.wp_Usuario.update({
      where: { id: usuario.id },
      data: { senhaHash: novoHash, senhaLocalConfigurada: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Erro ao alterar senha:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao alterar senha' },
      { status: 500 }
    );
  }
}

