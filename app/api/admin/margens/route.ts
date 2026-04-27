import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { obterUsuarioDoRequest } from '@/lib/utils/auth';
import { registrarLogAlteracaoPreco } from '@/lib/pricing/auditoriaPreco';

const canais = [
  'DISPLAY_PROGRAMATICO',
  'VIDEO_PROGRAMATICO',
  'CTV',
  'AUDIO_DIGITAL',
  'SOCIAL_PROGRAMATICO',
  'CRM_MEDIA',
  'IN_LIVE',
  'CPL_CPI',
] as const;

const schemaCriarMargem = z.object({
  canal: z.enum(canais),
  margemMinima: z.coerce
    .number()
    .min(0, 'Margem mínima deve ser maior ou igual a zero')
    .max(100, 'Margem mínima deve ser menor ou igual a 100'),
  descricao: z.string().optional(),
  origem: z.string().optional(),
  ativo: z.boolean().optional(),
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

    const ativo = request.nextUrl.searchParams.get('ativo');
    const where: any = {};
    if (ativo === 'true' || ativo === 'false') {
      where.ativo = ativo === 'true';
    }

    const margens = ativo === 'true' || ativo === 'false'
      ? await prisma.$queryRawUnsafe<any[]>(
          `SELECT * FROM "wp_MargemMinima" WHERE "ativo" = $1 ORDER BY "canal" ASC`,
          ativo === 'true'
        )
      : await prisma.$queryRawUnsafe<any[]>(
          `SELECT * FROM "wp_MargemMinima" ORDER BY "canal" ASC`
        );

    return NextResponse.json({
      success: true,
      margens: margens.map((item) => ({
        ...item,
        margemMinima: Number(item.margemMinima),
      })),
    });
  } catch (error) {
    console.error('Erro ao listar margens mínimas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar margens mínimas' },
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

    const dados = schemaCriarMargem.parse(await request.json());
    const margemExistente = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT "id" FROM "wp_MargemMinima" WHERE "canal" = $1::"CanalInventario" LIMIT 1`,
      dados.canal
    );

    if (margemExistente.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Já existe margem mínima para este canal.' },
        { status: 409 }
      );
    }

    const margemInserida = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO "wp_MargemMinima"
        ("id", "canal", "margemMinima", "descricao", "origem", "ativo", "createdAt", "updatedAt")
       VALUES ($1, $2::"CanalInventario", $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      crypto.randomUUID(),
      dados.canal,
      dados.margemMinima,
      dados.descricao ?? null,
      dados.origem || 'MANUAL',
      dados.ativo ?? true
    );
    const margem = margemInserida[0];

    await registrarLogAlteracaoPreco({
      usuarioId: usuario.userId,
      campo: 'MARGEM_MINIMA_CREATE',
      valorAnterior: '-',
      valorNovo: JSON.stringify({
        id: margem.id,
        canal: margem.canal,
        margemMinima: Number(margem.margemMinima),
      }),
      motivo: 'Criação de margem mínima',
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
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao criar margem mínima:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar margem mínima' },
      { status: 500 }
    );
  }
}
