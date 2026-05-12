import { NextRequest, NextResponse } from 'next/server';
import { Role, StatusCotacao } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { obterUserIdDoRequest, usuarioTemRole } from '@/lib/utils/auth';
import { gerarBriefingPDF } from '@/lib/pdf/geradorBriefingPDF';
import { montarLinhasBriefingObservacoes } from '@/lib/cotacao/briefingLinhas';
import {
  resolveCotacaoFinalDecisionRecipients,
  sendPerformanceFinalDecisionEmail,
} from '@/lib/notifications/cotacaoEmail';

export const dynamic = 'force-dynamic';

const schemaDecisao = z.object({
  cotacaoId: z.string().uuid(),
  decisaoStatus: z.enum(['APROVADA', 'RECUSADA']),
  decisaoComentario: z.string().optional(),
});

type DefinicaoCampanha = 'PERFORMANCE' | 'PROGRAMATICA' | 'WHATSAPP_SMS_PUSH';

function extrairObservacoesGeraisTexto(observacoes: string | null): string {
  if (!observacoes || observacoes.trim() === '') return 'Sem observações.';
  try {
    const payload = JSON.parse(observacoes) as {
      solicitacao?: { observacoesGerais?: string };
    };
    const texto = payload?.solicitacao?.observacoesGerais;
    if (typeof texto === 'string' && texto.trim() !== '') {
      return texto.trim();
    }
    return 'Sem observações.';
  } catch {
    return 'Sem observações.';
  }
}

function extrairQueueEmailMessageId(observacoes?: string | null): string | undefined {
  if (!observacoes) return undefined;
  try {
    const payload = JSON.parse(observacoes) as {
      workflowPerformance?: { queueEmailMessageId?: string };
    };
    const value = payload?.workflowPerformance?.queueEmailMessageId;
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function extrairDefinicaoCampanha(observacoes?: string | null): DefinicaoCampanha[] {
  if (!observacoes) return [];
  try {
    const payload = JSON.parse(observacoes) as {
      estrategia?: { definicaoCampanha?: string[] };
    };
    const definicao = payload?.estrategia?.definicaoCampanha || [];
    return definicao.filter(
      (item): item is DefinicaoCampanha =>
        item === 'PERFORMANCE' || item === 'PROGRAMATICA' || item === 'WHATSAPP_SMS_PUSH'
    );
  } catch {
    return [];
  }
}

function extrairRegiaoExibicao(observacoes: string | null, regiao: string): string {
  if (!observacoes) return regiao;
  try {
    const payload = JSON.parse(observacoes) as {
      cobertura?: { tipoRegiao?: string; cidades?: string; estadosSelecionados?: string[] };
    };
    const tipo = String(payload?.cobertura?.tipoRegiao || '').toUpperCase();
    if (tipo === 'CIDADES') {
      const cidades = String(payload?.cobertura?.cidades || '').trim();
      return cidades || regiao;
    }
    if (tipo === 'ESTADO') {
      const estados = Array.isArray(payload?.cobertura?.estadosSelecionados)
        ? payload!.cobertura!.estadosSelecionados!.filter(Boolean)
        : [];
      return estados.length > 0 ? estados.join(', ') : regiao;
    }
    return regiao;
  } catch {
    return regiao;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = obterUserIdDoRequest(request.headers);
    const isAdmin = await usuarioTemRole(userId, [Role.ADMIN]);
    if (!isAdmin || !userId) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = schemaDecisao.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const dados = parsed.data;
    const cotacao = await prisma.wp_Cotacao.findUnique({
      where: { id: dados.cotacaoId },
      select: {
        id: true,
        clienteNome: true,
        clienteSegmento: true,
        objetivo: true,
        budget: true,
        regiao: true,
        status: true,
        observacoes: true,
        solicitanteEmail: true,
        solicitanteNome: true,
        agenciaNome: true,
        pdfUrl: true,
      },
    });
    if (!cotacao) {
      return NextResponse.json(
        { success: false, error: 'Cotação não encontrada.' },
        { status: 404 }
      );
    }

    if (cotacao.status !== StatusCotacao.AGUARDANDO_APROVACAO) {
      return NextResponse.json(
        { success: false, error: 'Cotação não está aguardando aprovação.' },
        { status: 409 }
      );
    }

    const definicaoCampanha = extrairDefinicaoCampanha(cotacao.observacoes);
    if (!definicaoCampanha.includes('PERFORMANCE')) {
      return NextResponse.json(
        { success: false, error: 'Cotação não é de performance para decisão interna.' },
        { status: 409 }
      );
    }

    const recipients = resolveCotacaoFinalDecisionRecipients({
      solicitanteEmail: cotacao.solicitanteEmail || undefined,
      definicaoCampanha,
    });
    if (recipients.to.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Solicitante sem e-mail válido para envio da decisão final.',
          warnings: recipients.warnings,
        },
        { status: 400 }
      );
    }

    const attachments: Array<{ path: string; filename: string }> = [];
    if (cotacao.pdfUrl) {
      const normalized = cotacao.pdfUrl.startsWith('/') ? cotacao.pdfUrl.slice(1) : cotacao.pdfUrl;
      const absolutePath = path.join(process.cwd(), 'public', normalized);
      if (fs.existsSync(absolutePath)) {
        attachments.push({
          path: absolutePath,
          filename: path.basename(absolutePath),
        });
      }
    }

    const pdfDir = path.join(process.cwd(), 'public', 'pdfs');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }
    const briefingPdfFileName = `cotacao-briefing-resposta-${cotacao.id}-${Date.now()}.pdf`;
    const briefingPdfPath = path.join(pdfDir, briefingPdfFileName);
    await gerarBriefingPDF(
      {
        cotacaoId: cotacao.id,
        clienteNome: cotacao.clienteNome,
        clienteSegmento: cotacao.clienteSegmento,
        objetivo: cotacao.objetivo,
        budget: Number(cotacao.budget),
        regiao: extrairRegiaoExibicao(cotacao.observacoes, cotacao.regiao),
        definicaoCampanha,
        cotacaoProativa: false,
        solicitanteNome: cotacao.solicitanteNome || 'Não informado',
        solicitanteEmail: cotacao.solicitanteEmail || 'Não informado',
        agenciaNome: cotacao.agenciaNome || 'Não informada',
        observacoesGerais: extrairObservacoesGeraisTexto(cotacao.observacoes),
        linhasEspelho: montarLinhasBriefingObservacoes(cotacao.observacoes),
      },
      briefingPdfPath
    );
    attachments.push({ path: briefingPdfPath, filename: briefingPdfFileName });

    try {
      await sendPerformanceFinalDecisionEmail(
        {
          cotacaoId: cotacao.id,
          clienteNome: cotacao.clienteNome,
          clienteSegmento: cotacao.clienteSegmento,
          objetivo: cotacao.objetivo,
          budget: Number(cotacao.budget),
          regiao: extrairRegiaoExibicao(cotacao.observacoes, cotacao.regiao),
          definicaoCampanha,
          solicitanteNome: cotacao.solicitanteNome || undefined,
          solicitanteEmail: cotacao.solicitanteEmail || undefined,
          agenciaNome: cotacao.agenciaNome || undefined,
          observacoes: cotacao.observacoes || undefined,
          attachments,
          decisaoStatus: dados.decisaoStatus,
          decisaoComentario: dados.decisaoComentario,
          replyToMessageId: extrairQueueEmailMessageId(cotacao.observacoes),
        },
        recipients
      );
    } finally {
      if (fs.existsSync(briefingPdfPath)) {
        fs.unlinkSync(briefingPdfPath);
      }
    }

    await prisma.$transaction([
      prisma.wp_Cotacao.update({
        where: { id: cotacao.id },
        data: { status: dados.decisaoStatus },
      }),
      prisma.wp_LogAlteracaoPreco.create({
        data: {
          cotacaoId: cotacao.id,
          usuarioId: userId,
          campo: 'PERFORMANCE_DECISAO_FINAL',
          valorAnterior: cotacao.status,
          valorNovo: dados.decisaoStatus,
          motivo: dados.decisaoComentario || `Decisão final registrada no fluxo interno`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      status: dados.decisaoStatus,
      warnings: recipients.warnings,
    });
  } catch (error) {
    console.error('Erro ao finalizar decisão de performance:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao finalizar decisão de performance.' },
      { status: 500 }
    );
  }
}

