/**
 * API Route: Login
 * POST /api/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { generateToken } from '@/lib/auth/session';
import { mapDbRoleToUi } from '@/lib/utils/roles';

const schemaLogin = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dados = schemaLogin.parse(body);

    // Busca usuário
    const usuario = await prisma.wp_Usuario.findUnique({
      where: { email: dados.email },
    });

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Email ou senha inválidos' },
        { status: 401 }
      );
    }

    // Verifica se está ativo
    if (!usuario.ativo) {
      return NextResponse.json(
        { success: false, error: 'Usuário inativo' },
        { status: 403 }
      );
    }

    // Verifica senha
    const senhaValida = await verifyPassword(dados.senha, usuario.senhaHash);

    if (!senhaValida) {
      return NextResponse.json(
        { success: false, error: 'Email ou senha inválidos' },
        { status: 401 }
      );
    }

    // Gera token
    const token = generateToken({
      userId: usuario.id,
      email: usuario.email,
      role: usuario.role,
    });

    return NextResponse.json({
      success: true,
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: mapDbRoleToUi(usuario.role),
      },
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao fazer login' },
      { status: 500 }
    );
  }
}

