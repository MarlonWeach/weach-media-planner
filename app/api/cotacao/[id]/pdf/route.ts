/**
 * API Route: Gerar PDF da Cotação
 * POST /api/cotacao/{id}/pdf
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { obterUserIdDoRequest, podeAcessarCotacao } from '@/lib/utils/auth';
import { gerarPDF } from '@/lib/pdf/geradorPDF';
import { gerarBriefingPDF } from '@/lib/pdf/geradorBriefingPDF';
import {
  resolveCotacaoEmailRecipients,
  sendCotacaoOperationalEmail,
} from '@/lib/notifications/cotacaoEmail';
import { normalizarCidadesParaExibicao } from '@/lib/utils/cidades';
import path from 'path';
import fs from 'fs';

type DefinicaoCampanha = 'PERFORMANCE' | 'PROGRAMATICA' | 'WHATSAPP_SMS_PUSH';

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

    // Gera o PDF
    const pdfDir = path.join(process.cwd(), 'public', 'pdfs');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const nowTs = Date.now();
    const pdfFileName = `cotacao-${cotacaoId}-${nowTs}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFileName);

    await gerarPDF(dadosPDF, pdfPath);
    const briefingPdfFileName = `cotacao-briefing-${cotacaoId}-${nowTs}.pdf`;
    const briefingPdfPath = path.join(pdfDir, briefingPdfFileName);

    // Atualiza URL do PDF na cotação
    const pdfUrl = `/pdfs/${pdfFileName}`;
    await prisma.wp_Cotacao.update({
      where: { id: cotacaoId },
      data: { pdfUrl },
    });

    // Dispara e-mail operacional quando a cotação é efetivamente enviada para análise
    // (na geração do PDF), evitando disparo no momento de criação de rascunho.
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

    if (recipients.shouldSend && cotacao.status !== 'ENVIADA') {
      try {
        if (recipients.to.length === 0) {
          throw new Error('Destinatário principal ausente (EMAIL_COTACAO_TO).');
        }

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
          },
          briefingPdfPath
        );

        await sendCotacaoOperationalEmail(
          {
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
            attachments: [
              { path: pdfPath, filename: pdfFileName },
              { path: briefingPdfPath, filename: briefingPdfFileName },
            ],
          },
          {
            to: recipients.to,
            cc: recipients.cc,
          }
        );

        await prisma.wp_Cotacao.update({
          where: { id: cotacaoId },
          data: { status: 'ENVIADA' },
        });
      } catch (emailError) {
        console.error(
          '[CotacaoEmail][erro]',
          JSON.stringify({ cotacaoId, required: recipients.required, emailError })
        );
        if (recipients.required) {
          return NextResponse.json(
            {
              success: false,
              error:
                'PDF gerado, mas o envio de e-mail obrigatório para análise de performance falhou. Revise configuração SMTP/destinatários.',
              cotacaoId,
              pdfUrl,
            },
            { status: 500 }
          );
        }
      } finally {
        if (fs.existsSync(briefingPdfPath)) {
          fs.unlinkSync(briefingPdfPath);
        }
      }
    } else if (!recipients.shouldSend) {
      console.warn(
        '[CotacaoEmail][skip]',
        JSON.stringify({ cotacaoId, motivo: 'regra', definicaoCampanha, status: cotacao.status })
      );
    } else if (cotacao.status === 'ENVIADA') {
      console.warn(
        '[CotacaoEmail][skip]',
        JSON.stringify({ cotacaoId, motivo: 'status-ja-enviada', definicaoCampanha })
      );
    }

    return NextResponse.json({
      success: true,
      pdfUrl,
      message: 'PDF gerado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);

    return NextResponse.json(
      { success: false, error: 'Erro ao gerar PDF' },
      { status: 500 }
    );
  }
}

