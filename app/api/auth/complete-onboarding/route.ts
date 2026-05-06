import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';

const schemaCompleteOnboarding = z
  .object({
    token: z.string().min(1, 'Token é obrigatório'),
    email: z.string().email('Email inválido'),
    senha: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    confirmarSenha: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((value) => value.senha === value.confirmarSenha, {
    message: 'Confirmação de senha não confere',
    path: ['confirmarSenha'],
  });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dados = schemaCompleteOnboarding.parse(body);
    const chave = `onboarding_solicitante:${dados.token}`;

    const config = await prisma.wp_Configuracao.findUnique({
      where: { chave },
      select: { id: true, valor: true },
    });
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Link inválido ou expirado.' },
        { status: 400 }
      );
    }

    const valor = (config.valor || {}) as {
      solicitanteId?: string;
      email?: string;
      expiresAt?: string;
      usedAt?: string | null;
    };
    if (!valor.email || !valor.solicitanteId || !valor.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Token de onboarding inválido.' },
        { status: 400 }
      );
    }

    if (String(valor.email).toLowerCase() !== dados.email.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Email não corresponde ao convite.' },
        { status: 400 }
      );
    }

    if (valor.usedAt) {
      return NextResponse.json(
        { success: false, error: 'Este link já foi utilizado.' },
        { status: 400 }
      );
    }

    if (new Date(valor.expiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: 'Este link expirou. Solicite um novo convite.' },
        { status: 400 }
      );
    }

    const solicitante = await prisma.wp_Solicitante.findUnique({
      where: { id: valor.solicitanteId },
      select: { id: true, nome: true, email: true, ativo: true },
    });
    if (!solicitante || !solicitante.ativo) {
      return NextResponse.json(
        { success: false, error: 'Solicitante não encontrado ou inativo.' },
        { status: 404 }
      );
    }

    const senhaHash = await hashPassword(dados.senha);
    const usuarioExistente = await prisma.wp_Usuario.findUnique({
      where: { email: solicitante.email.toLowerCase() },
      select: { id: true },
    });

    if (usuarioExistente) {
      await prisma.wp_Usuario.update({
        where: { id: usuarioExistente.id },
        data: {
          senhaHash,
          role: Role.COMERCIAL,
          ativo: true,
        },
      });
    } else {
      await prisma.wp_Usuario.create({
        data: {
          nome: solicitante.nome,
          email: solicitante.email.toLowerCase(),
          senhaHash,
          role: Role.COMERCIAL,
          ativo: true,
        },
      });
    }

    await prisma.wp_Configuracao.update({
      where: { id: config.id },
      data: {
        valor: {
          ...valor,
          usedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Senha criada com sucesso.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Erro ao concluir onboarding:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao concluir criação de senha.' },
      { status: 500 }
    );
  }
}

