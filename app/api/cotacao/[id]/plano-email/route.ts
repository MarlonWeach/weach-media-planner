/**
 * POST /api/cotacao/{id}/plano-email
 * Envia e-mail operacional (ou fila performance) com plano .xlsx + briefing PDF,
 * sem alterar status da cotação nem gerar PDF comercial. Usado após “Baixar plano”.
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { prisma } from '@/lib/prisma';
import { obterUserIdDoRequest, podeAcessarCotacao } from '@/lib/utils/auth';
import { montarDadosCotacaoParaExportacaoPlano } from '@/lib/cotacao/montarDadosExportacaoPlanoMidiaComercial';
import { resolverApenasPerformance } from '@/lib/cotacao/definicaoCampanhaCotacao';
import {
  extrairPayloadObservacoes,
  montarRegiaoExibicao,
  type ObservacaoPayload,
} from '@/lib/cotacao/regiaoExibicaoCotacao';
import { gerarBufferPlanoMidiaXlsx } from '@/lib/excel/gerarPlanoMidiaXlsx';
import { montarNomeArquivoPlanoMidiaXlsx } from '@/lib/cotacao/nomeArquivoPlanoMidia';
import { gerarBriefingPDF } from '@/lib/pdf/geradorBriefingPDF';
import { montarLinhasBriefingObservacoes } from '@/lib/cotacao/briefingLinhas';
import {
  resolveCotacaoEmailRecipients,
  resolveCotacaoInternalRecipients,
  sendCotacaoOperationalEmail,
  sendPerformanceQueueNotificationEmail,
} from '@/lib/notifications/cotacaoEmail';

export const dynamic = 'force-dynamic';

function extrairObservacoesGeraisTexto(observacoes: string | null): string {
  if (!observacoes || observacoes.trim() === '') return 'Sem observações.';
  try {
    const payload = JSON.parse(observacoes) as ObservacaoPayload;
    const texto = payload?.solicitacao?.observacoesGerais;
    if (typeof texto === 'string' && texto.trim() !== '') {
      return texto.trim();
    }
    return 'Sem observações.';
  } catch {
    const textoLivre = observacoes.trim();
    if (textoLivre.startsWith('{') && textoLivre.endsWith('}')) {
      return 'Sem observações.';
    }
    return textoLivre;
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cotacaoId = params.id;
  let xlsxPath: string | null = null;
  let briefingPdfPath: string | null = null;

  try {
    const userId = obterUserIdDoRequest(_request.headers);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cotacaoId)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }

    const cotacao = await prisma.wp_Cotacao.findUnique({
      where: { id: cotacaoId },
      include: { vendedor: { select: { nome: true, email: true } } },
    });

    if (!cotacao) {
      return NextResponse.json({ success: false, error: 'Cotação não encontrada' }, { status: 404 });
    }

    const temPermissao = await podeAcessarCotacao(userId, cotacao.vendedorId);
    if (!temPermissao) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const { definicaoCampanha, apenasPerformance } = resolverApenasPerformance(
      cotacao.observacoes,
      cotacao.mixSugerido
    );
    if (apenasPerformance) {
      return NextResponse.json(
        {
          success: false,
          error: 'E-mail com plano tabular não se aplica a cotação somente performance.',
        },
        { status: 400 }
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

    const dadosPDF = montarDadosCotacaoParaExportacaoPlano(cotacao, explicacaoComercial);
    const isPerformance = definicaoCampanha.includes('PERFORMANCE');

    const attachmentDir = path.join(os.tmpdir(), 'weach-media-planner-plano-email');
    if (!fs.existsSync(attachmentDir)) {
      fs.mkdirSync(attachmentDir, { recursive: true });
    }
    const nowTs = Date.now();
    const xlsxFileName = montarNomeArquivoPlanoMidiaXlsx(dadosPDF.clienteNome, cotacaoId);
    xlsxPath = path.join(attachmentDir, xlsxFileName);
    const xlsxBuffer = await gerarBufferPlanoMidiaXlsx(dadosPDF, {
      dataCotacao: cotacao.createdAt,
      agenciaNome:
        (cotacao.agenciaNome || payloadObs?.solicitacao?.agencia || '').trim() || '—',
      regiaoTexto: regiaoExibicao,
    });
    fs.writeFileSync(xlsxPath, xlsxBuffer);

    const briefingPdfFileName = `cotacao-briefing-${cotacaoId}-${nowTs}.pdf`;
    briefingPdfPath = path.join(attachmentDir, briefingPdfFileName);

    await gerarBriefingPDF(
      {
        cotacaoId: cotacao.id,
        clienteNome: cotacao.clienteNome,
        clienteSegmento: cotacao.clienteSegmento,
        objetivo: cotacao.objetivo,
        budget: Number(cotacao.budget),
        regiao: regiaoExibicao,
        definicaoCampanha: definicaoCampanha,
        cotacaoProativa: Boolean(payloadObs?.solicitacao?.cotacaoProativa),
        solicitanteNome:
          cotacao.solicitanteNome || payloadObs?.solicitacao?.solicitante || 'Não informado',
        solicitanteEmail:
          cotacao.solicitanteEmail || payloadObs?.solicitacao?.solicitanteEmail || 'Não informado',
        agenciaNome: cotacao.agenciaNome || payloadObs?.solicitacao?.agencia || 'Não informada',
        observacoesGerais: extrairObservacoesGeraisTexto(cotacao.observacoes),
        linhasEspelho: montarLinhasBriefingObservacoes(cotacao.observacoes),
      },
      briefingPdfPath
    );

    const emailPayload = {
      cotacaoId: cotacao.id,
      clienteNome: cotacao.clienteNome,
      clienteSegmento: cotacao.clienteSegmento,
      objetivo: cotacao.objetivo,
      budget: Number(cotacao.budget),
      regiao: regiaoExibicao,
      definicaoCampanha: definicaoCampanha,
      solicitanteNome:
        cotacao.solicitanteNome || payloadObs?.solicitacao?.solicitante || undefined,
      solicitanteEmail:
        cotacao.solicitanteEmail || payloadObs?.solicitacao?.solicitanteEmail || undefined,
      agenciaNome: cotacao.agenciaNome || payloadObs?.solicitacao?.agencia || undefined,
      cotacaoProativa: Boolean(payloadObs?.solicitacao?.cotacaoProativa),
      observacoes: cotacao.observacoes || undefined,
      mix: dadosPDF.mix,
      precos: dadosPDF.precos,
      estimativas: dadosPDF.estimativas,
      attachments: [
        { path: xlsxPath, filename: xlsxFileName },
        { path: briefingPdfPath, filename: briefingPdfFileName },
      ],
    };

    if (isPerformance) {
      const recipients = resolveCotacaoInternalRecipients({
        solicitanteEmail: cotacao.solicitanteEmail || payloadObs?.solicitacao?.solicitanteEmail || undefined,
      });
      if (recipients.to.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Destinatário interno (EMAIL_COTACAO_TO) não configurado.' },
          { status: 500 }
        );
      }
      await sendPerformanceQueueNotificationEmail(emailPayload, {
        to: recipients.to,
        cc: recipients.cc,
      });
    } else {
      const recipients = resolveCotacaoEmailRecipients({
        definicaoCampanha: definicaoCampanha,
        solicitanteEmail: cotacao.solicitanteEmail || undefined,
      });
      if (!recipients.shouldSend) {
        return NextResponse.json({
          success: true,
          emailEnviado: false,
          motivo: 'regra-de-envio-nao-disparada',
        });
      }
      if (recipients.to.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Destinatário principal ausente (EMAIL_COTACAO_TO).' },
          { status: 500 }
        );
      }
      await sendCotacaoOperationalEmail(emailPayload, {
        to: recipients.to,
        cc: recipients.cc,
      });
    }

    return NextResponse.json({ success: true, emailEnviado: true });
  } catch (error) {
    console.error('[cotacao/plano-email]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao enviar e-mail do plano',
      },
      { status: 500 }
    );
  } finally {
    if (xlsxPath && fs.existsSync(xlsxPath)) fs.unlinkSync(xlsxPath);
    if (briefingPdfPath && fs.existsSync(briefingPdfPath)) fs.unlinkSync(briefingPdfPath);
  }
}
