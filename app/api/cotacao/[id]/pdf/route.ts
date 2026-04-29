/**
 * API Route: Gerar PDF da Cotação
 * POST /api/cotacao/{id}/pdf
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { obterUserIdDoRequest, podeAcessarCotacao } from '@/lib/utils/auth';
import { gerarPDF } from '@/lib/pdf/geradorPDF';
import {
  resolveCotacaoEmailRecipients,
  sendCotacaoOperationalEmail,
} from '@/lib/notifications/cotacaoEmail';
import path from 'path';
import fs from 'fs';

type DefinicaoCampanha = 'PERFORMANCE' | 'PROGRAMATICA' | 'WHATSAPP_SMS_PUSH';

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
    const estimativas = cotacao.estimativas as any;

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
      mix: mix?.mix || [],
      precos,
      estimativas: estimativas || {
        impressoes: 0,
        cliques: 0,
        leads: 0,
        cpmEstimado: 0,
        cpcEstimado: 0,
        cplEstimado: 0,
      },
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

    const pdfFileName = `cotacao-${cotacaoId}-${Date.now()}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFileName);

    await gerarPDF(dadosPDF, pdfPath);

    // Atualiza URL do PDF na cotação
    const pdfUrl = `/pdfs/${pdfFileName}`;
    await prisma.wp_Cotacao.update({
      where: { id: cotacaoId },
      data: { pdfUrl },
    });

    // Dispara e-mail operacional quando a cotação é efetivamente enviada para análise
    // (na geração do PDF), evitando disparo no momento de criação de rascunho.
    const definicaoCampanha = extrairDefinicaoCampanhaDaObservacao(cotacao.observacoes);
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

        await sendCotacaoOperationalEmail(
          {
            cotacaoId: cotacao.id,
            clienteNome: cotacao.clienteNome,
            clienteSegmento: cotacao.clienteSegmento,
            objetivo: cotacao.objetivo,
            budget: Number(cotacao.budget),
            regiao: cotacao.regiao,
            definicaoCampanha,
            solicitanteNome: cotacao.solicitanteNome || undefined,
            solicitanteEmail: cotacao.solicitanteEmail || undefined,
            agenciaNome: cotacao.agenciaNome || undefined,
            observacoes: cotacao.observacoes || undefined,
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
      }
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

