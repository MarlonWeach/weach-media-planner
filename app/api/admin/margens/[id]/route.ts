import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { obterUsuarioDoRequest } from '@/lib/utils/auth';
import { registrarLogAlteracaoPreco } from '@/lib/pricing/auditoriaPreco';

const schemaAtualizarMargem = z.object({
  margemMinima: z.coerce
    .number()
    .min(0, 'Margem mínima deve ser maior ou igual a zero')
    .max(100, 'Margem mínima deve ser menor ou igual a 100'),
  descricao: z.string().optional(),
  origem: z.string().optional(),
});

const schemaStatus = z.object({
  ativo: z.boolean(),
});

export async function PUT(
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

    const margemAtualRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "wp_MargemMinima" WHERE "id" = $1 LIMIT 1`,
      params.id
    );
    const margemAtual = margemAtualRows[0];
    if (!margemAtual) {
      return NextResponse.json(
        { success: false, error: 'Margem mínima não encontrada.' },
        { status: 404 }
      );
    }

    const dados = schemaAtualizarMargem.parse(await request.json());
    const margemAtualizadaRows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE "wp_MargemMinima"
       SET "margemMinima" = $1, "descricao" = $2, "origem" = $3, "updatedAt" = NOW()
       WHERE "id" = $4
       RETURNING *`,
      dados.margemMinima,
      dados.descricao ?? null,
      dados.origem || margemAtual.origem,
      params.id
    );
    const margem = margemAtualizadaRows[0];

    await registrarLogAlteracaoPreco({
      usuarioId: usuario.userId,
      campo: 'MARGEM_MINIMA_UPDATE',
      valorAnterior: JSON.stringify({
        id: margemAtual.id,
        canal: margemAtual.canal,
        margemMinima: Number(margemAtual.margemMinima),
        ativo: margemAtual.ativo,
      }),
      valorNovo: JSON.stringify({
        id: margem.id,
        canal: margem.canal,
        margemMinima: Number(margem.margemMinima),
        ativo: margem.ativo,
      }),
      motivo: 'Atualização de margem mínima',
    });

    return NextResponse.json({
      success: true,
      margem: {
        ...margem,
        margemMinima: Number(margem.margemMinima),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar margem mínima:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar margem mínima' },
      { status: 500 }
    );
  }
}

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

    const margemAtualRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "wp_MargemMinima" WHERE "id" = $1 LIMIT 1`,
      params.id
    );
    const margemAtual = margemAtualRows[0];
    if (!margemAtual) {
      return NextResponse.json(
        { success: false, error: 'Margem mínima não encontrada.' },
        { status: 404 }
      );
    }

    const dados = schemaStatus.parse(await request.json());
    const margemAtualizadaRows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE "wp_MargemMinima"
       SET "ativo" = $1, "updatedAt" = NOW()
       WHERE "id" = $2
       RETURNING *`,
      dados.ativo,
      params.id
    );
    const margem = margemAtualizadaRows[0];

    await registrarLogAlteracaoPreco({
      usuarioId: usuario.userId,
      campo: 'MARGEM_MINIMA_STATUS',
      valorAnterior: margemAtual.ativo ? 'ATIVO' : 'INATIVO',
      valorNovo: margem.ativo ? 'ATIVO' : 'INATIVO',
      motivo: `Alteração de status da margem mínima ${margem.id}`,
    });

    return NextResponse.json({
      success: true,
      margem: {
        ...margem,
        margemMinima: Number(margem.margemMinima),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar status da margem mínima:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar status da margem mínima' },
      { status: 500 }
    );
  }
}
