import { NextRequest, NextResponse } from 'next/server';
import { ModeloCompra, Role } from '@prisma/client';
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

const tiposRegra = ['FIXO', 'CONDICIONAL'] as const;

const schemaAtualizarRegra = z.object({
  tipoRegra: z.enum(tiposRegra),
  canal: z.enum(canais),
  formato: z.string().optional(),
  modeloCompra: z.nativeEnum(ModeloCompra),
  nomeRegra: z.string().min(1, 'Nome da regra é obrigatório'),
  valor: z.coerce.number().positive('Valor deve ser maior que zero'),
  formula: z.string().optional(),
  condicoes: z.any().optional(),
  faixaMin: z.coerce.number().optional(),
  faixaMax: z.coerce.number().optional(),
  unidade: z.string().min(1, 'Unidade é obrigatória'),
  origem: z.string().optional(),
  ordem: z.coerce.number().int().optional(),
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

    const body = await request.json();
    const dados = schemaAtualizarRegra.parse(body);

    const regraAtual = await prisma.wp_ValorFixoPreco.findUnique({
      where: { id: params.id },
    });
    if (!regraAtual) {
      return NextResponse.json(
        { success: false, error: 'Regra não encontrada.' },
        { status: 404 }
      );
    }

    const regra = await prisma.wp_ValorFixoPreco.update({
      where: { id: params.id },
      data: {
        tipoRegra: dados.tipoRegra,
        canal: dados.canal,
        formato: dados.formato,
        modeloCompra: dados.modeloCompra,
        nomeRegra: dados.nomeRegra,
        valor: dados.valor,
        formula: dados.formula,
        condicoes: dados.condicoes,
        faixaMin: dados.faixaMin,
        faixaMax: dados.faixaMax,
        unidade: dados.unidade,
        origem: dados.origem || 'MANUAL',
        ordem: dados.ordem,
      },
    });

    await registrarLogAlteracaoPreco({
      usuarioId: usuario.userId,
      campo: 'REGRA_PRECO_UPDATE',
      valorAnterior: JSON.stringify({
        id: regraAtual.id,
        tipoRegra: regraAtual.tipoRegra,
        canal: regraAtual.canal,
        formato: regraAtual.formato,
        modeloCompra: regraAtual.modeloCompra,
        valor: Number(regraAtual.valor),
        ativo: regraAtual.ativo,
      }),
      valorNovo: JSON.stringify({
        id: regra.id,
        tipoRegra: regra.tipoRegra,
        canal: regra.canal,
        formato: regra.formato,
        modeloCompra: regra.modeloCompra,
        valor: Number(regra.valor),
        ativo: regra.ativo,
      }),
      motivo: 'Atualização de regra de preço',
    });

    return NextResponse.json({
      success: true,
      regra: {
        ...regra,
        valor: Number(regra.valor),
        faixaMin: regra.faixaMin == null ? null : Number(regra.faixaMin),
        faixaMax: regra.faixaMax == null ? null : Number(regra.faixaMax),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar regra de preço:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar regra de preço' },
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

    const body = await request.json();
    const dados = schemaStatus.parse(body);

    const regraAtual = await prisma.wp_ValorFixoPreco.findUnique({
      where: { id: params.id },
    });
    if (!regraAtual) {
      return NextResponse.json(
        { success: false, error: 'Regra não encontrada.' },
        { status: 404 }
      );
    }

    const regra = await prisma.wp_ValorFixoPreco.update({
      where: { id: params.id },
      data: { ativo: dados.ativo },
    });

    await registrarLogAlteracaoPreco({
      usuarioId: usuario.userId,
      campo: 'REGRA_PRECO_STATUS',
      valorAnterior: regraAtual.ativo ? 'ATIVO' : 'INATIVO',
      valorNovo: regra.ativo ? 'ATIVO' : 'INATIVO',
      motivo: `Alteração de status da regra ${regra.id}`,
    });

    return NextResponse.json({
      success: true,
      regra: {
        ...regra,
        valor: Number(regra.valor),
        faixaMin: regra.faixaMin == null ? null : Number(regra.faixaMin),
        faixaMax: regra.faixaMax == null ? null : Number(regra.faixaMax),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar status da regra de preço:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar status da regra de preço' },
      { status: 500 }
    );
  }
}
