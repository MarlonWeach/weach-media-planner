import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { obterUsuarioDoRequest } from '@/lib/utils/auth';
import { sendSolicitanteOnboardingEmail } from '@/lib/notifications/onboardingEmail';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const usuario = obterUsuarioDoRequest(request.headers);
    if (!usuario || (usuario.role !== Role.ADMIN && usuario.role !== Role.EXTERNO)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores e managers.' },
        { status: 403 }
      );
    }

    const solicitante = await prisma.wp_Solicitante.findUnique({
      where: { id: params.id },
      select: { id: true, nome: true, email: true, ativo: true },
    });
    if (!solicitante || !solicitante.ativo) {
      return NextResponse.json(
        { success: false, error: 'Solicitante não encontrado ou inativo.' },
        { status: 404 }
      );
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await prisma.wp_Configuracao.create({
      data: {
        chave: `onboarding_solicitante:${token}`,
        valor: {
          solicitanteId: solicitante.id,
          email: solicitante.email,
          expiresAt: expiresAt.toISOString(),
          usedAt: null,
        },
        descricao: 'Token para definição/redefinição de senha do solicitante',
      },
    });

    await sendSolicitanteOnboardingEmail({
      to: solicitante.email,
      nome: solicitante.nome,
      token,
    });

    return NextResponse.json({
      success: true,
      message: 'Convite de criação/reset de senha enviado com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao reenviar onboarding do solicitante:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao reenviar onboarding.' },
      { status: 500 }
    );
  }
}

