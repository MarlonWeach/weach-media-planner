/**
 * API Route: Gerar PDF da Cotação
 * POST /api/cotacao/{id}/pdf
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { obterUserIdDoRequest, podeAcessarCotacao } from '@/lib/utils/auth';
import { gerarPDF } from '@/lib/pdf/geradorPDF';
import { gerarBriefingPDF } from '@/lib/pdf/geradorBriefingPDF';
import { montarLinhasBriefingObservacoes } from '@/lib/cotacao/briefingLinhas';
import {
  resolveCotacaoInternalRecipients,
  resolveCotacaoEmailRecipients,
  sendPerformanceQueueNotificationEmail,
  sendCotacaoOperationalEmail,
} from '@/lib/notifications/cotacaoEmail';
import { syncCotacaoToGoogleSheets } from '@/lib/integrations/googleSheetsCotacao';
import {
  extrairPayloadObservacoes,
  montarRegiaoExibicao,
  type ObservacaoPayload,
} from '@/lib/cotacao/regiaoExibicaoCotacao';
import { montarDadosCotacaoParaExportacaoPlano } from '@/lib/cotacao/montarDadosExportacaoPlanoMidiaComercial';
import {
  extrairDefinicaoCampanhaDaObservacao,
  resolverApenasPerformance,
} from '@/lib/cotacao/definicaoCampanhaCotacao';
import { gerarBufferPlanoMidiaXlsx } from '@/lib/excel/gerarPlanoMidiaXlsx';
import { montarNomeArquivoPlanoMidiaXlsx } from '@/lib/cotacao/nomeArquivoPlanoMidia';
import path from 'path';
import fs from 'fs';
import os from 'os';

const PDF_PUBLIC_CLEANUP_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function serializarErro(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause ? String(error.cause) : undefined,
    };
  }
  return {
    message: String(error),
  };
}

function limparPdfsPublicosAntigos(publicPdfDir: string): void {
  if (!fs.existsSync(publicPdfDir)) return;
  const agora = Date.now();
  const arquivos = fs.readdirSync(publicPdfDir);
  for (const arquivo of arquivos) {
    if (!arquivo.endsWith('.pdf') || !arquivo.startsWith('cotacao-')) {
      continue;
    }
    const caminhoArquivo = path.join(publicPdfDir, arquivo);
    try {
      const stat = fs.statSync(caminhoArquivo);
      const idadeMs = agora - stat.mtimeMs;
      if (idadeMs > PDF_PUBLIC_CLEANUP_MAX_AGE_MS) {
        fs.unlinkSync(caminhoArquivo);
      }
    } catch {
      // Mantém fluxo resiliente: falhas de limpeza não devem bloquear envio da cotação.
    }
  }
}

function atualizarObservacoesComQueueMessageId(
  observacoesAtual: string | null,
  messageId: string
): string {
  let payload: ObservacaoPayload = {};
  if (observacoesAtual) {
    try {
      const parsed = JSON.parse(observacoesAtual) as ObservacaoPayload;
      if (parsed && typeof parsed === 'object') {
        payload = parsed;
      }
    } catch {
      payload = {};
    }
  }
  return JSON.stringify(
    {
      ...payload,
      workflowPerformance: {
        ...(payload.workflowPerformance || {}),
        queueEmailMessageId: messageId,
      },
    },
    null,
    2
  );
}

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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cotacaoId = params.id;
    const userId = obterUserIdDoRequest(request.headers);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Validação básica do ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cotacaoId)) {
      return NextResponse.json(
        { success: false, error: 'ID de cotação inválido' },
        { status: 400 }
      );
    }

    // Busca a cotação
    const cotacao = await prisma.wp_Cotacao.findUnique({
      where: { id: cotacaoId },
      include: {
        vendedor: {
          select: {
            nome: true,
            email: true,
          },
        },
      },
    });

    if (!cotacao) {
      return NextResponse.json(
        { success: false, error: 'Cotação não encontrada' },
        { status: 404 }
      );
    }

    // Validação de permissões
    const temPermissao = await podeAcessarCotacao(userId, cotacao.vendedorId);
    if (!temPermissao) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const payloadObs = extrairPayloadObservacoes(cotacao.observacoes);
    const regiaoExibicao = montarRegiaoExibicao(cotacao.regiao, payloadObs);

    const historicoIA = await prisma.wp_HistoricoIA.findFirst({
      where: {
        cotacaoId: cotacao.id,
        tipo: 'EXPLICACAO',
      },
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

    const definicaoDaObservacao = extrairDefinicaoCampanhaDaObservacao(cotacao.observacoes);
    const { definicaoCampanha, apenasPerformance } = resolverApenasPerformance(
      cotacao.observacoes,
      cotacao.mixSugerido
    );
    const isPerformance = definicaoCampanha.includes('PERFORMANCE');

    if (definicaoDaObservacao.length === 0) {
      console.warn(
        '[CotacaoEmail][fallback-definicao]',
        JSON.stringify({ cotacaoId, source: 'mixSugerido', definicaoCampanha })
      );
    }
    const statusJaProcessado = ['ENVIADA', 'AGUARDANDO_APROVACAO', 'APROVADA', 'RECUSADA'].includes(
      String(cotacao.status)
    );

    // Gera o PDF
    const attachmentDir = path.join(os.tmpdir(), 'weach-media-planner-pdfs');
    if (!fs.existsSync(attachmentDir)) {
      fs.mkdirSync(attachmentDir, { recursive: true });
    }
    const publicPdfDir = path.join(process.cwd(), 'public', 'pdfs');
    const podePersistirPdfPublico = !process.env.VERCEL;
    if (podePersistirPdfPublico) {
      limparPdfsPublicosAntigos(publicPdfDir);
    }

    const nowTs = Date.now();
    let pdfFileName = '';
    let pdfPath = '';
    let pdfUrl: string | null = null;
    let xlsxFileName = '';
    let xlsxPath = '';

    if (!apenasPerformance) {
      pdfFileName = `cotacao-${cotacaoId}-${nowTs}.pdf`;
      pdfPath = path.join(attachmentDir, pdfFileName);
      await gerarPDF(dadosPDF, pdfPath);
      xlsxFileName = montarNomeArquivoPlanoMidiaXlsx(dadosPDF.clienteNome, cotacaoId);
      xlsxPath = path.join(attachmentDir, xlsxFileName);
      const xlsxBuffer = await gerarBufferPlanoMidiaXlsx(dadosPDF, {
        dataCotacao: cotacao.createdAt,
        agenciaNome:
          (cotacao.agenciaNome || payloadObs?.solicitacao?.agencia || '').trim() || '—',
        regiaoTexto: regiaoExibicao,
      });
      fs.writeFileSync(xlsxPath, xlsxBuffer);
      if (podePersistirPdfPublico) {
        if (!fs.existsSync(publicPdfDir)) {
          fs.mkdirSync(publicPdfDir, { recursive: true });
        }
        const publicPdfPath = path.join(publicPdfDir, pdfFileName);
        fs.copyFileSync(pdfPath, publicPdfPath);
        pdfUrl = `/pdfs/${pdfFileName}`;
      }
    }

    const briefingPdfFileName = `cotacao-briefing-${cotacaoId}-${nowTs}.pdf`;
    const briefingPdfPath = path.join(attachmentDir, briefingPdfFileName);
    const statusDestino = isPerformance ? 'AGUARDANDO_APROVACAO' : 'ENVIADA';
    if (!statusJaProcessado) {
      await prisma.$transaction([
        prisma.wp_Cotacao.update({
          where: { id: cotacaoId },
          data: { status: statusDestino as any, ...(pdfUrl ? { pdfUrl } : {}) },
        }),
        prisma.wp_LogAlteracaoPreco.create({
          data: {
            cotacaoId,
            usuarioId: userId,
            campo: 'PERFORMANCE_STATUS_WORKFLOW',
            valorAnterior: String(cotacao.status),
            valorNovo: String(statusDestino),
            motivo: isPerformance
              ? 'Cotação entrou na fila de decisão interna de performance'
              : 'Cotação enviada ao solicitante pelo fluxo operacional',
          },
        }),
      ]);
    } else {
      console.warn(
        '[CotacaoEmail][skip]',
        JSON.stringify({ cotacaoId, motivo: 'status-ja-processado', definicaoCampanha, status: cotacao.status })
      );
    }

    try {
      await gerarBriefingPDF(
        {
          cotacaoId: cotacao.id,
          clienteNome: cotacao.clienteNome,
          clienteSegmento: cotacao.clienteSegmento,
          objetivo: cotacao.objetivo,
          budget: Number(cotacao.budget),
          regiao: regiaoExibicao,
          definicaoCampanha,
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
        definicaoCampanha,
        solicitanteNome:
          cotacao.solicitanteNome || payloadObs?.solicitacao?.solicitante || undefined,
        solicitanteEmail:
          cotacao.solicitanteEmail ||
          payloadObs?.solicitacao?.solicitanteEmail ||
          undefined,
        agenciaNome: cotacao.agenciaNome || payloadObs?.solicitacao?.agencia || undefined,
        cotacaoProativa: Boolean(payloadObs?.solicitacao?.cotacaoProativa),
        observacoes: cotacao.observacoes || undefined,
        mix: dadosPDF.mix,
        precos: dadosPDF.precos,
        estimativas: dadosPDF.estimativas,
        attachments:
          apenasPerformance
            ? [{ path: briefingPdfPath, filename: briefingPdfFileName }]
            : [
                ...(pdfPath ? [{ path: pdfPath, filename: pdfFileName }] : []),
                ...(xlsxPath ? [{ path: xlsxPath, filename: xlsxFileName }] : []),
                { path: briefingPdfPath, filename: briefingPdfFileName },
              ],
      };

      if (isPerformance) {
        const recipients = resolveCotacaoInternalRecipients({
          solicitanteEmail: cotacao.solicitanteEmail || payloadObs?.solicitacao?.solicitanteEmail || undefined,
        });
        if (recipients.warnings.length > 0) {
          console.warn(
            '[CotacaoEmail][warnings]',
            JSON.stringify({ cotacaoId, warnings: recipients.warnings })
          );
        }
        if (recipients.to.length === 0) {
          throw new Error('Destinatário principal ausente (EMAIL_COTACAO_TO) para notificação interna.');
        }
        const queueEmailInfo = await sendPerformanceQueueNotificationEmail(emailPayload, {
          to: recipients.to,
          cc: recipients.cc,
        });
        if (queueEmailInfo.messageId) {
          await prisma.wp_Cotacao.update({
            where: { id: cotacaoId },
            data: {
              observacoes: atualizarObservacoesComQueueMessageId(
                cotacao.observacoes,
                queueEmailInfo.messageId
              ),
            },
          });
        }
      } else {
        const recipients = resolveCotacaoEmailRecipients({
          definicaoCampanha,
          solicitanteEmail: cotacao.solicitanteEmail || undefined,
        });
        if (recipients.warnings.length > 0) {
          console.warn(
            '[CotacaoEmail][warnings]',
            JSON.stringify({ cotacaoId, warnings: recipients.warnings })
          );
        }

        if (recipients.shouldSend) {
          if (recipients.to.length === 0) {
            throw new Error('Destinatário principal ausente (EMAIL_COTACAO_TO).');
          }
          await sendCotacaoOperationalEmail(emailPayload, {
            to: recipients.to,
            cc: recipients.cc,
          });
        } else {
          console.warn(
            '[CotacaoEmail][skip]',
            JSON.stringify({ cotacaoId, motivo: 'regra', definicaoCampanha, status: cotacao.status })
          );
        }
      }

      try {
        await syncCotacaoToGoogleSheets({
          id: cotacao.id,
          numeroSequencial: cotacao.numeroSequencial,
          createdAt: cotacao.createdAt,
          dataInicio: cotacao.dataInicio,
          dataFim: cotacao.dataFim,
          clienteNome: cotacao.clienteNome,
          clienteSegmento: cotacao.clienteSegmento,
          urlLp: cotacao.urlLp,
          budget: Number(cotacao.budget),
          solicitanteNome: cotacao.solicitanteNome,
          solicitanteEmail: cotacao.solicitanteEmail,
          agenciaNome: cotacao.agenciaNome,
          observacoes: cotacao.observacoes,
        });
      } catch (sheetsError) {
        console.error(
          '[CotacaoSheets][erro-nao-bloqueante]',
          JSON.stringify({ cotacaoId, erro: serializarErro(sheetsError) })
        );
      }
    } catch (dispatchError) {
      console.error(
        '[CotacaoDispatch][erro]',
        JSON.stringify({ cotacaoId, erro: serializarErro(dispatchError) })
      );
      return NextResponse.json(
        {
          success: false,
          error:
            'Falha no envio da cotação (e-mail, PDF ou Excel). Revise SMTP e destinatários. A sincronização com Google Sheets é registrada em log e pode ser retentada.',
          cotacaoId,
          pdfUrl,
        },
        { status: 500 }
      );
    } finally {
      if (fs.existsSync(briefingPdfPath)) {
        fs.unlinkSync(briefingPdfPath);
      }
      if (xlsxPath && fs.existsSync(xlsxPath)) {
        fs.unlinkSync(xlsxPath);
      }
      if (pdfPath && fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    }

    const temProgramaticaOuMensageria =
      definicaoCampanha.includes('PROGRAMATICA') ||
      definicaoCampanha.includes('WHATSAPP_SMS_PUSH');

    return NextResponse.json({
      success: true,
      pdfUrl,
      message: isPerformance
        ? temProgramaticaOuMensageria
          ? 'Cotação híbrida enviada: performance na fila interna; plano programático/mensageria anexo quando aplicável.'
          : 'Cotação de performance enviada para fila de aprovação interna.'
        : 'PDF gerado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao gerar PDF' },
      { status: 500 }
    );
  }
}

