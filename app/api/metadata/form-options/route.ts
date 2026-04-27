import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DEFAULT_SOLICITANTES = [
  { id: '11111111-1111-4111-8111-111111111111', nome: 'Marlon Nogueira', email: 'marlon@weachgroup.net' },
];

const DEFAULT_AGENCIAS = [
  { id: '22222222-2222-4222-8222-222222222222', nome: 'In House' },
];

export async function GET(request: NextRequest) {
  try {
    const [solicitantes, agencias] = await Promise.all([
      prisma.wp_Solicitante.findMany({
        where: { ativo: true },
        select: { id: true, nome: true, email: true },
        orderBy: { nome: 'asc' },
      }),
      prisma.wp_Agencia.findMany({
        where: { ativo: true },
        select: { id: true, nome: true },
        orderBy: { nome: 'asc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      solicitantes: solicitantes.length > 0 ? solicitantes : DEFAULT_SOLICITANTES,
      agencias: agencias.length > 0 ? agencias : DEFAULT_AGENCIAS,
    });
  } catch (error) {
    console.error('Erro ao buscar opções do formulário:', error);
    return NextResponse.json(
      {
        success: true,
        solicitantes: DEFAULT_SOLICITANTES,
        agencias: DEFAULT_AGENCIAS,
      },
      { status: 200 }
    );
  }
}
