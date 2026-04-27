/**
 * API Route: Calcular Preços
 * POST /api/pricing/calcular
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { calcularPrecosCotacao } from '@/lib/pricing/calculoPrecos';
import { validarPrecosContraRegras } from '@/lib/pricing/calculoPrecos';

const schemaCalcularPrecos = z.object({
  cpmBase: z.number().min(0).optional(),
  segmento: z.string(),
  regiao: z.string(),
  budget: z.number().min(1000),
  objetivo: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dados = schemaCalcularPrecos.parse(body);

    // Usa CPM base fornecido ou busca do banco (padrão: 4)
    const cpmBase = dados.cpmBase ?? 4;

    // Calcula preços
    const precos = await calcularPrecosCotacao({
      cpmBase,
      segmento: dados.segmento,
      regiao: dados.regiao,
      budget: dados.budget,
      objetivo: dados.objetivo,
    });

    // Valida contra regras de governança
    const validacao = await validarPrecosContraRegras(
      precos,
      'DISPLAY_PROGRAMATICO',
      dados.segmento,
      dados.regiao
    );

    return NextResponse.json({
      success: true,
      precos,
      validacao,
    });
  } catch (error) {
    console.error('Erro ao calcular preços:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao calcular preços' },
      { status: 500 }
    );
  }
}

