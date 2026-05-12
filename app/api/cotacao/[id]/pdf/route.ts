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
import { normalizarCidadesParaExibicao } from '@/lib/utils/cidades';
import path from 'path';
import fs from 'fs';
import os from 'os';

type DefinicaoCampanha = 'PERFORMANCE' | 'PROGRAMATICA' | 'WHATSAPP_SMS_PUSH';
const PDF_PUBLIC_CLEANUP_MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface ObservacaoPayload {
  solicitacao?: {
    solicitante?: string;
    solicitanteEmail?: string;
    agencia?: string;
    cotacaoProativa?: boolean;
    observacoesGerais?: string;
  };
  estrategia?: {
    definicaoCampanha?: string[];
  };
  cobertura?: {
    tipoRegiao?: string;
    estadosSelecionados?: string[];
    cidades?: string;
  };
  workflowPerformance?: {
    queueEmailMessageId?: string;
  };
}

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

function extrairDefinicaoCampanhaDaObservacao(observacoes: string | null): DefinicaoCampanha[] {
  if (!observacoes) return [];
  try {
    const parsed = JSON.parse(observacoes) as {
      estrategia?: { definicaoCampanha?: string[] };
    };
    const lista = parsed?.estrategia?.definicaoCampanha || [];
    return lista.filter(
      (item): item is DefinicaoCampanha =>
        item === 'PERFORMANCE' || item === 'PROGRAMATICA' || item === 'WHATSAPP_SMS_PUSH'
    );
  } catch {
    return [];
  }
}

function extrairPayloadObservacoes(observacoes: string | null): ObservacaoPayload | null {
  if (!observacoes) return null;
  try {
    const parsed = JSON.parse(observacoes) as ObservacaoPayload;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
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

function inferirDefinicaoCampanhaPeloMix(mixSugerido: unknown): DefinicaoCampanha[] {
  const rows: Array<{ canal?: string }> = Array.isArray(mixSugerido)
    ? (mixSugerido as Array<{ canal?: string }>)
    : Array.isArray((mixSugerido as { mix?: Array<{ canal?: string }> } | null)?.mix)
      ? ((mixSugerido as { mix?: Array<{ canal?: string }> }).mix as Array<{ canal?: string }>)
      : [];

  const canais = new Set(
    rows
      .map((row) => (typeof row?.canal === 'string' ? row.canal.toUpperCase() : ''))
      .filter(Boolean)
  );

  const result = new Set<DefinicaoCampanha>();
  if (canais.has('CPL_CPI')) {
    result.add('PERFORMANCE');
  }
  if (
    canais.has('DISPLAY_PROGRAMATICO') ||
    canais.has('VIDEO_PROGRAMATICO') ||
    canais.has('CTV') ||
    canais.has('AUDIO_DIGITAL') ||
    canais.has('SOCIAL_PROGRAMATICO') ||
    canais.has('IN_LIVE')
  ) {
    result.add('PROGRAMATICA');
  }
  if (canais.has('CRM_MEDIA')) {
    result.add('WHATSAPP_SMS_PUSH');
  }

  return Array.from(result);
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

function montarRegiaoExibicao(regiaoTecnica: string, payloadObs: ObservacaoPayload | null): string {
  const cobertura = payloadObs?.cobertura;
  if (!cobertura) return regiaoTecnica;

  const tipoRegiao = String(cobertura.tipoRegiao || '').toUpperCase();
  if (tipoRegiao === 'CIDADES') {
    const cidades = String(cobertura.cidades || '').trim();
    return cidades.length > 0 ? normalizarCidadesParaExibicao(cidades) : regiaoTecnica;
  }
  if (tipoRegiao === 'ESTADO') {
    const estados = Array.isArray(cobertura.estadosSelecionados)
      ? cobertura.estadosSelecionados.filter(Boolean)
      : [];
    return estados.length > 0 ? estados.join(', ') : regiaoTecnica;
  }
  return regiaoTecnica;
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

    // Prepara dados para o PDF
    const mix = cotacao.mixSugerido as any;
    const precos = cotacao.precosSugeridos as any;
    const estimativasRaw = cotacao.estimativas as any;
    const mixRows = Array.isArray(mix) ? mix : mix?.mix || [];
    const estimativas = {
      impressoes: Number(estimativasRaw?.impressoes || 0),
      cliques: Number(estimativasRaw?.cliques || 0),
      leads: Number(estimativasRaw?.leads || 0),
      cpmEstimado: Number(estimativasRaw?.cpmEstimado || 0),
      cpcEstimado: Number(estimativasRaw?.cpcEstimado || 0),
      cplEstimado: Number(estimativasRaw?.cplEstimado || 0),
    };
    if (estimativas.cpmEstimado <= 0 && estimativas.impressoes > 0) {
      estimativas.cpmEstimado = Number(cotacao.budget) / (estimativas.impressoes / 1000);
    }
    if (estimativas.cpcEstimado <= 0 && estimativas.cliques > 0) {
      estimativas.cpcEstimado = Number(cotacao.budget) / estimativas.cliques;
    }
    if (estimativas.cplEstimado <= 0 && estimativas.leads > 0) {
      estimativas.cplEstimado = Number(cotacao.budget) / estimativas.leads;
    }
    const payloadObs = extrairPayloadObservacoes(cotacao.observacoes);
    const regiaoExibicao = montarRegiaoExibicao(cotacao.regiao, payloadObs);

    const dadosPDF = {
      id: cotacao.id,
      clienteNome: cotacao.clienteNome,
      clienteSegmento: cotacao.clienteSegmento,
      objetivo: cotacao.objetivo,
      budget: Number(cotacao.budget),
      dataInicio: cotacao.dataInicio,
      dataFim: cotacao.dataFim,
      regiao: cotacao.regiao,
      explicacaoComercial: '', // Será preenchido se existir no histórico IA
      mix: mixRows,
      precos,
      estimativas,
      vendedor: {
        nome: cotacao.vendedor.nome,
        email: cotacao.vendedor.email,
      },
    };

    // Busca explicação comercial do histórico IA
    const historicoIA = await prisma.wp_HistoricoIA.findFirst({
      where: {
        cotacaoId: cotacao.id,
        tipo: 'EXPLICACAO',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (historicoIA) {
      try {
        const resposta = JSON.parse(historicoIA.respostaIa);
        dadosPDF.explicacaoComercial = typeof resposta === 'string' ? resposta : resposta.texto || '';
      } catch {
        dadosPDF.explicacaoComercial = historicoIA.respostaIa;
      }
    }

    const definicaoDaObservacao = extrairDefinicaoCampanhaDaObservacao(cotacao.observacoes);
    const definicaoCampanha =
      definicaoDaObservacao.length > 0
        ? definicaoDaObservacao
        : inferirDefinicaoCampanhaPeloMix(cotacao.mixSugerido);

    if (definicaoDaObservacao.length === 0) {
      console.warn(
        '[CotacaoEmail][fallback-definicao]',
        JSON.stringify({ cotacaoId, source: 'mixSugerido', definicaoCampanha })
      );
    }

    const isPerformance = definicaoCampanha.includes('PERFORMANCE');
    const temProgramaticaOuMensageria =
      definicaoCampanha.includes('PROGRAMATICA') ||
      definicaoCampanha.includes('WHATSAPP_SMS_PUSH');
    /** Só performance (sem programática/mensageria): não gera PDF de plano; híbrido gera plano da parte tabulada. */
    const apenasPerformance = isPerformance && !temProgramaticaOuMensageria;
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

    if (!apenasPerformance) {
      pdfFileName = `cotacao-${cotacaoId}-${nowTs}.pdf`;
      pdfPath = path.join(attachmentDir, pdfFileName);
      await gerarPDF(dadosPDF, pdfPath);
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
        mix: mixRows,
        precos,
        estimativas,
        attachments:
          apenasPerformance
            ? [{ path: briefingPdfPath, filename: briefingPdfFileName }]
            : [
                ...(pdfPath ? [{ path: pdfPath, filename: pdfFileName }] : []),
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
            'Falha no envio da cotação (e-mail/PDF). Revise SMTP e destinatários. A sincronização com Google Sheets é registrada em log e pode ser retentada.',
          cotacaoId,
          pdfUrl,
        },
        { status: 500 }
      );
    } finally {
      if (fs.existsSync(briefingPdfPath)) {
        fs.unlinkSync(briefingPdfPath);
      }
      if (pdfPath && fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    }

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

