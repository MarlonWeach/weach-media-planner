import { NextRequest, NextResponse } from 'next/server';
import { CanalInventario, ModeloCompra, Regiao, Role, Segmento } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { obterUsuarioDoRequest } from '@/lib/utils/auth';
import { registrarLogAlteracaoPreco } from '@/lib/pricing/auditoriaPreco';

const schemaAtualizarRegra = z
  .object({
    canal: z.nativeEnum(CanalInventario),
    segmento: z.nativeEnum(Segmento).optional(),
    regiao: z.nativeEnum(Regiao).optional(),
    formato: z.string().optional(),
    modeloCompra: z.nativeEnum(ModeloCompra),
    precoMin: z.coerce.number().nonnegative(),
    precoAlvo: z.coerce.number().nonnegative(),
    precoMax: z.coerce.number().nonnegative(),
  })
  .refine((data) => data.precoMin <= data.precoAlvo && data.precoAlvo <= data.precoMax, {
    message: 'Consistência inválida: precoMin <= precoAlvo <= precoMax',
    path: ['precoMax'],
  });

const schemaStatus = z.object({ ativo: z.boolean() });

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const usuario = obterUsuarioDoRequest(request.headers);
    if (!usuario || usuario.role !== Role.ADMIN) {
      return NextResponse.json({ success: false, error: 'Acesso negado.' }, { status: 403 });
    }
    const regraAtual = await prisma.wp_PrecoBase.findUnique({ where: { id: params.id } });
    if (!regraAtual) {
      return NextResponse.json({ success: false, error: 'Regra não encontrada.' }, { status: 404 });
    }
    const dados = schemaAtualizarRegra.parse(await request.json());
    const regra = await prisma.wp_PrecoBase.update({ where: { id: params.id }, data: dados });

    await registrarLogAlteracaoPreco({
      usuarioId: usuario.userId,
      campo: 'PISO_TETO_UPDATE',
      valorAnterior: JSON.stringify({
        id: regraAtual.id,
        precoMin: Number(regraAtual.precoMin),
        precoAlvo: Number(regraAtual.precoAlvo),
        precoMax: Number(regraAtual.precoMax),
      }),
      valorNovo: JSON.stringify({
        id: regra.id,
        precoMin: Number(regra.precoMin),
        precoAlvo: Number(regra.precoAlvo),
        precoMax: Number(regra.precoMax),
      }),
      motivo: 'Atualização de piso/teto',
    });

    return NextResponse.json({
      success: true,
      regra: {
        ...regra,
        precoMin: Number(regra.precoMin),
        precoAlvo: Number(regra.precoAlvo),
        precoMax: Number(regra.precoMax),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', details: error.errors }, { status: 400 });
    }
    console.error('Erro ao atualizar piso/teto:', error);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar piso/teto' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const usuario = obterUsuarioDoRequest(request.headers);
    if (!usuario || usuario.role !== Role.ADMIN) {
      return NextResponse.json({ success: false, error: 'Acesso negado.' }, { status: 403 });
    }
    const regraAtual = await prisma.wp_PrecoBase.findUnique({ where: { id: params.id } });
    if (!regraAtual) {
      return NextResponse.json({ success: false, error: 'Regra não encontrada.' }, { status: 404 });
    }
    const dados = schemaStatus.parse(await request.json());
    const regra = await prisma.wp_PrecoBase.update({ where: { id: params.id }, data: { ativo: dados.ativo } });

    await registrarLogAlteracaoPreco({
      usuarioId: usuario.userId,
      campo: 'PISO_TETO_STATUS',
      valorAnterior: regraAtual.ativo ? 'ATIVO' : 'INATIVO',
      valorNovo: regra.ativo ? 'ATIVO' : 'INATIVO',
      motivo: `Alteração de status da regra ${regra.id}`,
    });

    return NextResponse.json({
      success: true,
      regra: {
        ...regra,
        precoMin: Number(regra.precoMin),
        precoAlvo: Number(regra.precoAlvo),
        precoMax: Number(regra.precoMax),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', details: error.errors }, { status: 400 });
    }
    console.error('Erro ao atualizar status de piso/teto:', error);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar status de piso/teto' }, { status: 500 });
  }
}
