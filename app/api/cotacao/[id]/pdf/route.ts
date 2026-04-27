/**
 * API Route: Gerar PDF da Cotação
 * POST /api/cotacao/{id}/pdf
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { obterUserIdDoRequest, podeAcessarCotacao } from '@/lib/utils/auth';
import { gerarPDF } from '@/lib/pdf/geradorPDF';
import path from 'path';
import fs from 'fs';

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

