import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { obterUserIdDoRequest, usuarioTemRole } from '@/lib/utils/auth';
import { extrairHistoricoPerformance } from '@/lib/performance/historico';

function ehCotacaoPerformance(observacoes?: string | null): boolean {
  if (!observacoes) return false;
  try {
    const payload = JSON.parse(observacoes) as {
      estrategia?: { definicaoCampanha?: string[] };
    };
    const definicao = payload?.estrategia?.definicaoCampanha || [];
    return Array.isArray(definicao) && definicao.includes('PERFORMANCE');
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = obterUserIdDoRequest(request.headers);
    const isAdmin = await usuarioTemRole(userId, [Role.ADMIN]);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const format = (request.nextUrl.searchParams.get('format') || 'json').toLowerCase();
    const cotacoes = await prisma.wp_Cotacao.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        clienteNome: true,
        clienteSegmento: true,
        objetivo: true,
        regiao: true,
        budget: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        observacoes: true,
      },
    });

    const dataset = cotacoes
      .filter((cotacao) => ehCotacaoPerformance(cotacao.observacoes))
      .flatMap((cotacao) => {
        const historico = extrairHistoricoPerformance(cotacao.observacoes);
        return historico.registros.map((registro) => ({
          cotacaoId: cotacao.id,
          clienteNome: cotacao.clienteNome,
          clienteSegmento: cotacao.clienteSegmento,
          objetivo: cotacao.objetivo,
          regiao: cotacao.regiao,
          status: cotacao.status,
          budget: Number(cotacao.budget),
          createdAt: cotacao.createdAt.toISOString(),
          updatedAt: cotacao.updatedAt.toISOString(),
          canal: registro.canal,
          formato: registro.formato,
          modeloCompra: registro.modeloCompra,
          precoTabela: registro.precoTabela,
          precoFinalAplicado: registro.precoFinalAplicado,
          racionalTexto: registro.racionalTexto,
          racionalTags: registro.racionalTags.join('|'),
          motivoAjustePreco: registro.motivoAjustePreco,
          origemDecisao: registro.origemDecisao,
          atualizadoEm: registro.atualizadoEm,
          atualizadoPor: registro.atualizadoPor,
        }));
      });

    if (format === 'csv') {
      const header = Object.keys(dataset[0] || {
        cotacaoId: '',
        clienteNome: '',
        clienteSegmento: '',
        objetivo: '',
        regiao: '',
        status: '',
        budget: '',
        createdAt: '',
        updatedAt: '',
        canal: '',
        formato: '',
        modeloCompra: '',
        precoTabela: '',
        precoFinalAplicado: '',
        racionalTexto: '',
        racionalTags: '',
        motivoAjustePreco: '',
        origemDecisao: '',
        atualizadoEm: '',
        atualizadoPor: '',
      });
      const lines = dataset.map((row) =>
        header
          .map((key) => {
            const value = String((row as Record<string, unknown>)[key] ?? '');
            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(',')
      );
      const csv = [header.join(','), ...lines].join('\n');
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="dataset-performance.csv"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      dataset,
      total: dataset.length,
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de performance:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar relatório de performance.' },
      { status: 500 }
    );
  }
}

