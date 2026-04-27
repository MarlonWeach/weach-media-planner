/**
 * API Route: Gerenciar CPM Base
 * GET /api/admin/cpm-base - Obter valor atual
 * PUT /api/admin/cpm-base - Atualizar valor
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { obterUsuarioDoRequest } from '@/lib/utils/auth';
import { Role } from '@prisma/client';
import { registrarLogAlteracaoPreco } from '@/lib/pricing/auditoriaPreco';

const schemaAtualizarCpm = z.object({
  valor: z.number().positive('CPM base deve ser maior que zero'),
});

/**
 * GET - Obter valor atual do CPM base
 */
export async function GET(request: NextRequest) {
  try {
    const usuario = obterUsuarioDoRequest(request.headers);

    if (!usuario || usuario.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const config = await prisma.wp_Configuracao.findUnique({
      where: { chave: 'CPM_BASE_PROGRAMATICO' },
    });

    let valor = 4.0; // Valor padrão

    if (
      config?.valor != null &&
      typeof config.valor === 'object' &&
      !Array.isArray(config.valor) &&
      'valor' in config.valor
    ) {
      valor = Number((config.valor as { valor?: unknown }).valor) || 4.0;
    }

    // Busca histórico de alterações (filtrando por campo = 'CPM_BASE')
    const historico = await prisma.wp_LogAlteracaoPreco.findMany({
      where: {
        campo: 'CPM_BASE',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        usuario: {
          select: {
            nome: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      cpmBase: valor,
      historico: historico.map((log) => ({
        id: log.id,
        valorAnterior: parseFloat(log.valorAnterior) || 0,
        valorNovo: parseFloat(log.valorNovo) || 0,
        usuario: log.usuario,
        createdAt: log.createdAt,
        observacoes: log.motivo,
      })),
    });
  } catch (error) {
    console.error('Erro ao obter CPM base:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao obter CPM base' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Atualizar valor do CPM base
 */
export async function PUT(request: NextRequest) {
  try {
    const usuario = obterUsuarioDoRequest(request.headers);

    if (!usuario || usuario.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const dados = schemaAtualizarCpm.parse(body);

    // Busca valor atual
    const configAtual = await prisma.wp_Configuracao.findUnique({
      where: { chave: 'CPM_BASE_PROGRAMATICO' },
    });

    let valorAnterior = 4.0;
    if (
      configAtual?.valor != null &&
      typeof configAtual.valor === 'object' &&
      !Array.isArray(configAtual.valor) &&
      'valor' in configAtual.valor
    ) {
      valorAnterior = Number((configAtual.valor as { valor?: unknown }).valor) || 4.0;
    }

    // Atualiza ou cria configuração
    const config = await prisma.wp_Configuracao.upsert({
      where: { chave: 'CPM_BASE_PROGRAMATICO' },
      update: {
        valor: { valor: dados.valor },
        updatedAt: new Date(),
      },
      create: {
        chave: 'CPM_BASE_PROGRAMATICO',
        valor: { valor: dados.valor },
        descricao: 'CPM Base Programático (D3) - Valor central que determina todos os preços',
        ativo: true,
      },
    });

    await registrarLogAlteracaoPreco({
      usuarioId: usuario.userId,
      campo: 'CPM_BASE',
      valorAnterior: valorAnterior.toString(),
      valorNovo: dados.valor.toString(),
      motivo: `CPM base alterado de ${valorAnterior} para ${dados.valor}`,
    });

    return NextResponse.json({
      success: true,
      cpmBase: dados.valor,
      message: 'CPM base atualizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar CPM base:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar CPM base' },
      { status: 500 }
    );
  }
}

