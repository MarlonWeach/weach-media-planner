/**
 * API Route: Buscar Cotação por ID
 * GET /api/cotacao/{id}
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { obterUserIdDoRequest, podeAcessarCotacao } from '@/lib/utils/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cotacaoId = params.id;

    // Validação básica do ID (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cotacaoId)) {
      return NextResponse.json(
        { success: false, error: 'ID de cotação inválido' },
        { status: 400 }
      );
    }

    // Obtém ID do usuário do request
    const userId = obterUserIdDoRequest(request.headers);

    // Busca a cotação com relacionamentos
    const cotacao = await prisma.wp_Cotacao.findUnique({
      where: { id: cotacaoId },
      include: {
        vendedor: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
          },
        },
        historicoIA: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Últimos 10 registros
        },
        logsPreco: {
          orderBy: { createdAt: 'desc' },
          take: 20, // Últimos 20 logs
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Verifica se a cotação existe
    if (!cotacao) {
      return NextResponse.json(
        { success: false, error: 'Cotação não encontrada' },
        { status: 404 }
      );
    }

    // Validação de permissões
    // TODO: Melhorar autenticação completa na Task 2-1
    const temPermissao = await podeAcessarCotacao(userId, cotacao.vendedorId);
    
    if (!temPermissao) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Formata resposta
    const resposta = {
      success: true,
      cotacao: {
        id: cotacao.id,
        createdAt: cotacao.createdAt,
        updatedAt: cotacao.updatedAt,
        clienteNome: cotacao.clienteNome,
        clienteSegmento: cotacao.clienteSegmento,
        urlLp: cotacao.urlLp,
        objetivo: cotacao.objetivo,
        budget: Number(cotacao.budget),
        dataInicio: cotacao.dataInicio,
        dataFim: cotacao.dataFim,
        regiao: cotacao.regiao,
        maturidadeDigital: cotacao.maturidadeDigital,
        risco: cotacao.risco,
        aceitaModeloHibrido: cotacao.aceitaModeloHibrido,
        observacoes: cotacao.observacoes,
        solicitanteId: cotacao.solicitanteId,
        solicitanteNome: cotacao.solicitanteNome,
        solicitanteEmail: cotacao.solicitanteEmail,
        agenciaId: cotacao.agenciaId,
        agenciaNome: cotacao.agenciaNome,
        mixSugerido: cotacao.mixSugerido,
        precosSugeridos: cotacao.precosSugeridos,
        estimativas: cotacao.estimativas,
        pdfUrl: cotacao.pdfUrl,
        status: cotacao.status,
        vendedor: {
          id: cotacao.vendedor.id,
          nome: cotacao.vendedor.nome,
          email: cotacao.vendedor.email,
          role: cotacao.vendedor.role,
        },
        historicoIA: cotacao.historicoIA.map((item) => ({
          id: item.id,
          tipo: item.tipo,
          createdAt: item.createdAt,
          modeloUsado: item.modeloUsado,
          // Não retornar prompt/resposta completo por segurança (pode ser opcional)
        })),
        logsPreco: cotacao.logsPreco.map((log) => ({
          id: log.id,
          campo: log.campo,
          valorAnterior: log.valorAnterior,
          valorNovo: log.valorNovo,
          motivo: log.motivo,
          createdAt: log.createdAt,
          usuario: log.usuario,
        })),
      },
    };

    return NextResponse.json(resposta);
  } catch (error) {
    console.error('Erro ao buscar cotação:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao buscar cotação' },
      { status: 500 }
    );
  }
}

