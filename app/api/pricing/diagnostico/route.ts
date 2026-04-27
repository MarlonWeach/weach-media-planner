/**
 * API Route: Diagnóstico de Pricing
 * POST /api/pricing/diagnostico
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { calcularPrecosCotacao, obterDiagnosticoPricing, validarPrecosContraRegras } from '@/lib/pricing/calculoPrecos';
import { obterUserIdDoRequest } from '@/lib/utils/auth';

const schemaDiagnosticoPricing = z.object({
  cpmBase: z.number().min(0).optional(),
  segmento: z.string(),
  regiao: z.string(),
  budget: z.number().min(1000),
  objetivo: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = obterUserIdDoRequest(request.headers);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const dados = schemaDiagnosticoPricing.parse(body);

    const cpmBase = dados.cpmBase ?? 4;

    const [precos, diagnostico] = await Promise.all([
      calcularPrecosCotacao({
        cpmBase,
        segmento: dados.segmento,
        regiao: dados.regiao,
        budget: dados.budget,
        objetivo: dados.objetivo,
      }),
      obterDiagnosticoPricing(),
    ]);

    const validacao = await validarPrecosContraRegras(
      precos,
      'DISPLAY_PROGRAMATICO',
      dados.segmento,
      dados.regiao
    );

    return NextResponse.json({
      success: true,
      entrada: dados,
      precos,
      validacao,
      diagnostico,
    });
  } catch (error) {
    console.error('Erro no diagnóstico de pricing:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao gerar diagnóstico de pricing' },
      { status: 500 }
    );
  }
}
