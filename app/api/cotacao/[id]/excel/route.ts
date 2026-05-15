/**
 * GET /api/cotacao/{id}/excel
 * Download do plano de mídia em .xlsx (mesmo conteúdo tabular do PDF comercial).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { obterUserIdDoRequest, podeAcessarCotacao } from '@/lib/utils/auth';
import { montarDadosCotacaoParaExportacaoPlano } from '@/lib/cotacao/montarDadosExportacaoPlanoMidiaComercial';
import { resolverApenasPerformance } from '@/lib/cotacao/definicaoCampanhaCotacao';
import {
  extrairPayloadObservacoes,
  montarRegiaoExibicao,
} from '@/lib/cotacao/regiaoExibicaoCotacao';
import { gerarBufferPlanoMidiaXlsx } from '@/lib/excel/gerarPlanoMidiaXlsx';
import { isIdCotacaoValido } from '@/lib/cotacao/idCotacao';
import { montarNomeArquivoPlanoMidiaXlsx } from '@/lib/cotacao/nomeArquivoPlanoMidia';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cotacaoId = params.id;
    const userId = obterUserIdDoRequest(request.headers);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    if (!isIdCotacaoValido(cotacaoId)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }

    const cotacao = await prisma.wp_Cotacao.findUnique({
      where: { id: cotacaoId },
      include: {
        vendedor: { select: { nome: true, email: true } },
      },
    });

    if (!cotacao) {
      return NextResponse.json({ success: false, error: 'Cotação não encontrada' }, { status: 404 });
    }

    const temPermissao = await podeAcessarCotacao(userId, cotacao.vendedorId);
    if (!temPermissao) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const { apenasPerformance } = resolverApenasPerformance(
      cotacao.observacoes,
      cotacao.mixSugerido
    );
    if (apenasPerformance) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Plano tabular em Excel não está disponível para cotação somente performance (sem programática/mensageria).',
        },
        { status: 404 }
      );
    }

    const payloadObs = extrairPayloadObservacoes(cotacao.observacoes);
    const regiaoExibicao = montarRegiaoExibicao(cotacao.regiao, payloadObs);

    const historicoIA = await prisma.wp_HistoricoIA.findFirst({
      where: { cotacaoId: cotacao.id, tipo: 'EXPLICACAO' },
      orderBy: { createdAt: 'desc' },
    });

    let explicacaoComercial = '';
    if (historicoIA) {
      try {
        const resposta = JSON.parse(historicoIA.respostaIa);
        explicacaoComercial =
          typeof resposta === 'string' ? resposta : resposta.texto || '';
      } catch {
        explicacaoComercial = historicoIA.respostaIa;
      }
    }

    const dados = montarDadosCotacaoParaExportacaoPlano(cotacao, explicacaoComercial);
    const buffer = await gerarBufferPlanoMidiaXlsx(dados, {
      dataCotacao: cotacao.createdAt,
      agenciaNome:
        (cotacao.agenciaNome || payloadObs?.solicitacao?.agencia || '').trim() || '—',
      regiaoTexto: regiaoExibicao,
    });
    const nomeArquivo = montarNomeArquivoPlanoMidiaXlsx(dados.clienteNome, cotacaoId);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[cotacao/excel]', error);
    return NextResponse.json({ success: false, error: 'Erro ao gerar Excel' }, { status: 500 });
  }
}
