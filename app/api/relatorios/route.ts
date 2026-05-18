/**
 * GET /api/relatorios
 * Relatórios comerciais internos (PBI-3). Autenticado; não é API pública para terceiros.
 *
 * Query: dataInicio, dataFim, segmento, solicitanteId, status, format=json|xlsx|xls
 */

import { NextRequest, NextResponse } from 'next/server';
import { gerarRelatorioComercial } from '@/lib/relatorios/agregacoes';
import { gerarBufferRelatorioComercialXlsx } from '@/lib/relatorios/gerarRelatorioComercialXlsx';
import { parseFiltrosRelatorioFromSearchParams } from '@/lib/relatorios/filtros';
import {
  podeAcessarRelatorios,
  podeExportarRelatorio,
  obterRoleUsuario,
  veRelatoriosGlobais,
} from '@/lib/relatorios/permissoes';
import { obterUserIdDoRequest } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = obterUserIdDoRequest(request.headers);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const permitido = await podeAcessarRelatorios(userId);
    if (!permitido) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para relatórios' },
        { status: 403 }
      );
    }

    const role = await obterRoleUsuario(userId);
    const visaoGlobal = role ? veRelatoriosGlobais(role) : false;
    const filtros = parseFiltrosRelatorioFromSearchParams(request.nextUrl.searchParams);

    const relatorio = await gerarRelatorioComercial({
      filtros,
      userId,
      visaoGlobal,
    });

    const format = (request.nextUrl.searchParams.get('format') || 'json').toLowerCase();
    if (format === 'xlsx' || format === 'xls') {
      if (!role || !podeExportarRelatorio(role)) {
        return NextResponse.json(
          { success: false, error: 'Exportação Excel não disponível para seu perfil' },
          { status: 403 }
        );
      }
      const buffer = await gerarBufferRelatorioComercialXlsx(relatorio);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="relatorio-comercial-${Date.now()}.xlsx"`,
        },
      });
    }

    return NextResponse.json({ success: true, relatorio });
  } catch (error) {
    console.error('[api/relatorios]', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar relatório' },
      { status: 500 }
    );
  }
}
