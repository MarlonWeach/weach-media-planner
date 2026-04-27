import { NextRequest, NextResponse } from 'next/server';
import { ModeloCompra, Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { obterUsuarioDoRequest } from '@/lib/utils/auth';
import { registrarLogAlteracaoPreco } from '@/lib/pricing/auditoriaPreco';

const canais = [
  'DISPLAY_PROGRAMATICO',
  'VIDEO_PROGRAMATICO',
  'CTV',
  'AUDIO_DIGITAL',
  'SOCIAL_PROGRAMATICO',
  'CRM_MEDIA',
  'IN_LIVE',
  'CPL_CPI',
] as const;

const tiposRegra = ['FIXO', 'CONDICIONAL'] as const;

const schemaCriarRegra = z.object({
  tipoRegra: z.enum(tiposRegra),
  canal: z.enum(canais),
  formato: z.string().optional(),
  modeloCompra: z.nativeEnum(ModeloCompra),
  nomeRegra: z.string().min(1, 'Nome da regra é obrigatório'),
  valor: z.coerce.number().positive('Valor deve ser maior que zero'),
  formula: z.string().optional(),
  condicoes: z.any().optional(),
  faixaMin: z.coerce.number().optional(),
  faixaMax: z.coerce.number().optional(),
  unidade: z.string().min(1, 'Unidade é obrigatória'),
  origem: z.string().optional(),
  ordem: z.coerce.number().int().optional(),
  ativo: z.boolean().optional(),
});

const regrasPadrao: Array<{
  tipoRegra: (typeof tiposRegra)[number];
  canal: (typeof canais)[number];
  formato: string;
  modeloCompra: ModeloCompra;
  nomeRegra: string;
  valor: number;
  formula?: string;
  unidade: string;
  origem: string;
  ordem: number;
}> = [
  {
    tipoRegra: 'FIXO',
    canal: 'DISPLAY_PROGRAMATICO',
    formato: 'CPM Base',
    modeloCompra: 'CPM',
    nomeRegra: 'CPM Base D3',
    valor: 4,
    unidade: 'CPM',
    origem: 'PLANILHA',
    ordem: 1,
  },
  {
    tipoRegra: 'CONDICIONAL',
    canal: 'DISPLAY_PROGRAMATICO',
    formato: 'Gama',
    modeloCompra: 'CPM',
    nomeRegra: 'Gama = D3 + 1.75',
    valor: 5.75,
    formula: 'D3+1.75',
    unidade: 'CPM',
    origem: 'PLANILHA',
    ordem: 2,
  },
  {
    tipoRegra: 'FIXO',
    canal: 'DISPLAY_PROGRAMATICO',
    formato: 'Native Diferenciado',
    modeloCompra: 'CPM',
    nomeRegra: 'Native Diferenciado',
    valor: 28,
    unidade: 'CPM',
    origem: 'PLANILHA',
    ordem: 3,
  },
  {
    tipoRegra: 'FIXO',
    canal: 'DISPLAY_PROGRAMATICO',
    formato: 'Display Retargeting',
    modeloCompra: 'CPM',
    nomeRegra: 'Retargeting',
    valor: 15,
    unidade: 'CPM',
    origem: 'PLANILHA',
    ordem: 4,
  },
  {
    tipoRegra: 'FIXO',
    canal: 'DISPLAY_PROGRAMATICO',
    formato: 'CPC',
    modeloCompra: 'CPC',
    nomeRegra: 'Display - CPC',
    valor: 2.5,
    formula: 'D3*0.625',
    unidade: 'CPC',
    origem: 'PLANILHA',
    ordem: 5,
  },
  {
    tipoRegra: 'FIXO',
    canal: 'DISPLAY_PROGRAMATICO',
    formato: 'Spotify Leader Board',
    modeloCompra: 'CPM',
    nomeRegra: 'Spotify Leader Board',
    valor: 8.8,
    formula: 'D3*2.2',
    unidade: 'CPM',
    origem: 'PLANILHA',
    ordem: 6,
  },
  {
    tipoRegra: 'FIXO',
    canal: 'DISPLAY_PROGRAMATICO',
    formato: 'Spotify Overlay',
    modeloCompra: 'CPM',
    nomeRegra: 'Spotify Overlay',
    valor: 72,
    unidade: 'CPM',
    origem: 'PLANILHA',
    ordem: 7,
  },
  {
    tipoRegra: 'FIXO',
    canal: 'DISPLAY_PROGRAMATICO',
    formato: 'Deezer Display',
    modeloCompra: 'CPM',
    nomeRegra: 'Deezer Display',
    valor: 72,
    unidade: 'CPM',
    origem: 'PLANILHA',
    ordem: 8,
  },
  {
    tipoRegra: 'CONDICIONAL',
    canal: 'VIDEO_PROGRAMATICO',
    formato: 'Vídeo 15" - CPCV',
    modeloCompra: 'CPV',
    nomeRegra: 'Vídeo 15" - CPCV',
    valor: 0.0296,
    formula: 'E9*0.85',
    unidade: 'CPCV',
    origem: 'PLANILHA',
    ordem: 9,
  },
  {
    tipoRegra: 'CONDICIONAL',
    canal: 'VIDEO_PROGRAMATICO',
    formato: 'Vídeo 30" - CPCV',
    modeloCompra: 'CPV',
    nomeRegra: 'Vídeo 30" - CPCV',
    valor: 0.04,
    formula: 'D3/115',
    unidade: 'CPCV',
    origem: 'PLANILHA',
    ordem: 10,
  },
  {
    tipoRegra: 'CONDICIONAL',
    canal: 'VIDEO_PROGRAMATICO',
    formato: 'Youtube Bumper 6" - CPCV',
    modeloCompra: 'CPV',
    nomeRegra: 'Youtube Bumper 6" - CPCV',
    valor: 0.03,
    formula: 'D9',
    unidade: 'CPCV',
    origem: 'PLANILHA',
    ordem: 11,
  },
  {
    tipoRegra: 'CONDICIONAL',
    canal: 'VIDEO_PROGRAMATICO',
    formato: 'Youtube 30" - CPCV',
    modeloCompra: 'CPV',
    nomeRegra: 'Youtube 30" - CPCV',
    valor: 0.07,
    formula: 'E9*2',
    unidade: 'CPCV',
    origem: 'PLANILHA',
    ordem: 12,
  },
  {
    tipoRegra: 'CONDICIONAL',
    canal: 'VIDEO_PROGRAMATICO',
    formato: 'Spotify Video 30" - CPCV',
    modeloCompra: 'CPV',
    nomeRegra: 'Spotify Video 30" - CPCV',
    valor: 0.14,
    unidade: 'CPCV',
    origem: 'PLANILHA',
    ordem: 13,
  },
  {
    tipoRegra: 'CONDICIONAL',
    canal: 'VIDEO_PROGRAMATICO',
    formato: 'Deezer Video 30" - CPCV',
    modeloCompra: 'CPV',
    nomeRegra: 'Deezer Video 30" - CPCV',
    valor: 0.1,
    unidade: 'CPCV',
    origem: 'PLANILHA',
    ordem: 14,
  },
  {
    tipoRegra: 'CONDICIONAL',
    canal: 'CTV',
    formato: 'CTV 30" (Open) - CPCV',
    modeloCompra: 'CPV',
    nomeRegra: 'CTV 30" (Open) - CPCV',
    valor: 0.04,
    formula: 'E9',
    unidade: 'CPCV',
    origem: 'PLANILHA',
    ordem: 20,
  },
  {
    tipoRegra: 'CONDICIONAL',
    canal: 'CTV',
    formato: 'Globo FAST CPCV',
    modeloCompra: 'CPV',
    nomeRegra: 'Globo FAST CPCV',
    valor: 0.17,
    formula: 'IF(D3=4,0.17,IF(D3=5,0.2,IF(D3=7,0.2,IF(D3=8,0.23,IF(D3=9,0.25,"")))))',
    unidade: 'CPCV',
    origem: 'PLANILHA',
    ordem: 21,
  },
  {
    tipoRegra: 'CONDICIONAL',
    canal: 'CTV',
    formato: 'GloboPlay 15" CPCV',
    modeloCompra: 'CPV',
    nomeRegra: 'GloboPlay 15" CPCV',
    valor: 0.12,
    formula: 'IF(D3=4,0.12,IF(D3=5,0.18,IF(D3=7,0.18,IF(D3=8,0.2,IF(D3=9,0.22,"")))))',
    unidade: 'CPCV',
    origem: 'PLANILHA',
    ordem: 22,
  },
  {
    tipoRegra: 'CONDICIONAL',
    canal: 'CTV',
    formato: 'Samsung FAST CPCV',
    modeloCompra: 'CPV',
    nomeRegra: 'Samsung FAST CPCV',
    valor: 0.15,
    formula: 'IF(D3=4,0.15,IF(D3=5,0.18,IF(D3=7,0.18,IF(D3=8,0.2,IF(D3=9,0.22,"")))))',
    unidade: 'CPCV',
    origem: 'PLANILHA',
    ordem: 23,
  },
  {
    tipoRegra: 'CONDICIONAL',
    canal: 'CTV',
    formato: 'Philips / AOC CPCV',
    modeloCompra: 'CPV',
    nomeRegra: 'Philips / AOC CPCV',
    valor: 0.1,
    formula: 'IF(D3=4,0.1,IF(D3=5,0.13,IF(D3=7,0.13,IF(D3=8,0.17,IF(D3=9,0.19,"")))))',
    unidade: 'CPCV',
    origem: 'PLANILHA',
    ordem: 24,
  },
  {
    tipoRegra: 'CONDICIONAL',
    canal: 'CTV',
    formato: 'MAX / Netflix / Disney+ / Outros',
    modeloCompra: 'CPV',
    nomeRegra: 'MAX / Netflix / Disney+ / Outros',
    valor: 1,
    formula: 'NOTION',
    unidade: 'CPCV',
    origem: 'PLANILHA',
    ordem: 25,
  },
  {
    tipoRegra: 'FIXO',
    canal: 'AUDIO_DIGITAL',
    formato: 'Spotify Audio',
    modeloCompra: 'CPM',
    nomeRegra: 'Spotify Audio',
    valor: 47,
    unidade: 'CPM',
    origem: 'PLANILHA',
    ordem: 30,
  },
  {
    tipoRegra: 'FIXO',
    canal: 'AUDIO_DIGITAL',
    formato: 'Spotify CPCL (complete listening)',
    modeloCompra: 'CPCL',
    nomeRegra: 'Spotify CPCL',
    valor: 0.07,
    formula: 'E9*2',
    unidade: 'CPCL',
    origem: 'PLANILHA',
    ordem: 31,
  },
  {
    tipoRegra: 'FIXO',
    canal: 'AUDIO_DIGITAL',
    formato: 'Deezer Audio',
    modeloCompra: 'CPM',
    nomeRegra: 'Deezer Audio',
    valor: 64,
    unidade: 'CPM',
    origem: 'PLANILHA',
    ordem: 32,
  },
  {
    tipoRegra: 'FIXO',
    canal: 'AUDIO_DIGITAL',
    formato: 'Deezer CPCL (complete listening)',
    modeloCompra: 'CPCL',
    nomeRegra: 'Deezer CPCL',
    valor: 0.05,
    unidade: 'CPCL',
    origem: 'PLANILHA',
    ordem: 33,
  },
  {
    tipoRegra: 'FIXO',
    canal: 'SOCIAL_PROGRAMATICO',
    formato: 'LinkedIn Sponsored',
    modeloCompra: 'CPM',
    nomeRegra: 'LinkedIn Sponsored',
    valor: 90,
    unidade: 'CPM',
    origem: 'PLANILHA',
    ordem: 40,
  },
  {
    tipoRegra: 'FIXO',
    canal: 'SOCIAL_PROGRAMATICO',
    formato: 'LinkedIn Inmail',
    modeloCompra: 'CPM',
    nomeRegra: 'LinkedIn Inmail',
    valor: 2.8,
    unidade: 'CPM',
    origem: 'PLANILHA',
    ordem: 41,
  },
  {
    tipoRegra: 'FIXO',
    canal: 'SOCIAL_PROGRAMATICO',
    formato: 'Kwai',
    modeloCompra: 'CPM',
    nomeRegra: 'Kwai',
    valor: 9,
    unidade: 'CPM',
    origem: 'PLANILHA',
    ordem: 42,
  },
  {
    tipoRegra: 'CONDICIONAL',
    canal: 'SOCIAL_PROGRAMATICO',
    formato: 'Tik Tok (CPM)',
    modeloCompra: 'CPM',
    nomeRegra: 'Tik Tok (CPM)',
    valor: 15,
    formula: 'IF(D3=4,15,IF(D3=5,16,IF(D3=7,16,IF(D3=8,17,IF(D3=9,18,"")))))',
    unidade: 'CPM',
    origem: 'PLANILHA',
    ordem: 43,
  },
  {
    tipoRegra: 'FIXO',
    canal: 'SOCIAL_PROGRAMATICO',
    formato: 'FB Trafego (CPM)',
    modeloCompra: 'CPM',
    nomeRegra: 'FB Trafego (CPM)',
    valor: 10,
    formula: 'IF(D3=4,10,IF(D3=5,12,IF(D3=7,12,IF(D3=8,14,IF(D3=9,16,"")))))',
    unidade: 'CPM',
    origem: 'PLANILHA',
    ordem: 44,
  },
  {
    tipoRegra: 'FIXO',
    canal: 'SOCIAL_PROGRAMATICO',
    formato: 'FB Engajamento (CPE)',
    modeloCompra: 'CPC',
    nomeRegra: 'FB Engajamento (CPE)',
    valor: 3,
    formula: 'IF(D3=4,3,IF(D3=5,4,IF(D3=7,4,IF(D3=8,4.5,IF(D3=9,5,"")))))',
    unidade: 'CPE',
    origem: 'PLANILHA',
    ordem: 45,
  },
  {
    tipoRegra: 'FIXO',
    canal: 'SOCIAL_PROGRAMATICO',
    formato: 'FB lead ad (CPM)',
    modeloCompra: 'CPM',
    nomeRegra: 'FB lead ad (CPM)',
    valor: 65,
    unidade: 'CPM',
    origem: 'PLANILHA',
    ordem: 46,
  },
  {
    tipoRegra: 'CONDICIONAL',
    canal: 'IN_LIVE',
    formato: 'Display 3km',
    modeloCompra: 'CPM',
    nomeRegra: 'Display 3km',
    valor: 6,
    formula: 'D3*1.5',
    unidade: 'CPM',
    origem: 'PLANILHA',
    ordem: 50,
  },
  {
    tipoRegra: 'CONDICIONAL',
    canal: 'IN_LIVE',
    formato: 'Video 3km',
    modeloCompra: 'CPV',
    nomeRegra: 'Video 3km',
    valor: 0.07,
    formula: 'D21/90',
    unidade: 'CPCV',
    origem: 'PLANILHA',
    ordem: 51,
  },
  {
    tipoRegra: 'FIXO',
    canal: 'CRM_MEDIA',
    formato: 'Push',
    modeloCompra: 'CPD',
    nomeRegra: 'Push',
    valor: 0.6,
    unidade: 'CPD',
    origem: 'PLANILHA',
    ordem: 60,
  },
];

async function garantirSeedPadrao() {
  for (const regra of regrasPadrao) {
    const existente = await prisma.wp_ValorFixoPreco.findFirst({
      where: {
        canal: regra.canal,
        modeloCompra: regra.modeloCompra,
        formato: regra.formato,
        nomeRegra: regra.nomeRegra,
      },
      select: { id: true, valor: true, formula: true, origem: true },
    });

    if (!existente) {
      await prisma.wp_ValorFixoPreco.create({
        data: regra,
      });
      continue;
    }

    const deveAtualizarCalibracao =
      (typeof existente.formula === 'string' && existente.formula.includes('VALIDACAO')) ||
      (existente.origem === 'PLANILHA' && Number(existente.valor) === 1);

    if (deveAtualizarCalibracao) {
      await prisma.wp_ValorFixoPreco.update({
        where: { id: existente.id },
        data: {
          tipoRegra: regra.tipoRegra,
          canal: regra.canal,
          formato: regra.formato,
          modeloCompra: regra.modeloCompra,
          nomeRegra: regra.nomeRegra,
          valor: regra.valor,
          formula: regra.formula,
          unidade: regra.unidade,
          origem: regra.origem,
          ordem: regra.ordem,
        },
      });
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const usuario = obterUsuarioDoRequest(request.headers);
    if (!usuario || usuario.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    await garantirSeedPadrao();

    const params = request.nextUrl.searchParams;
    const canal = params.get('canal');
    const tipoRegra = params.get('tipoRegra');
    const ativo = params.get('ativo');

    const where: any = {};
    if (canal) where.canal = canal;
    if (tipoRegra) where.tipoRegra = tipoRegra;
    if (ativo === 'true' || ativo === 'false') where.ativo = ativo === 'true';

    const regras = await prisma.wp_ValorFixoPreco.findMany({
      where,
      orderBy: [{ tipoRegra: 'asc' }, { ordem: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      regras: regras.map((item) => ({
        ...item,
        valor: Number(item.valor),
        faixaMin: item.faixaMin == null ? null : Number(item.faixaMin),
        faixaMax: item.faixaMax == null ? null : Number(item.faixaMax),
      })),
    });
  } catch (error) {
    console.error('Erro ao listar regras de preço:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar regras de preço' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const usuario = obterUsuarioDoRequest(request.headers);
    if (!usuario || usuario.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const dados = schemaCriarRegra.parse(body);

    const regra = await prisma.wp_ValorFixoPreco.create({
      data: {
        tipoRegra: dados.tipoRegra,
        canal: dados.canal,
        formato: dados.formato,
        modeloCompra: dados.modeloCompra,
        nomeRegra: dados.nomeRegra,
        valor: dados.valor,
        formula: dados.formula,
        condicoes: dados.condicoes,
        faixaMin: dados.faixaMin,
        faixaMax: dados.faixaMax,
        unidade: dados.unidade,
        origem: dados.origem || 'MANUAL',
        ordem: dados.ordem,
        ativo: dados.ativo ?? true,
      },
    });

    await registrarLogAlteracaoPreco({
      usuarioId: usuario.userId,
      campo: 'REGRA_PRECO_CREATE',
      valorAnterior: '-',
      valorNovo: JSON.stringify({
        id: regra.id,
        tipoRegra: regra.tipoRegra,
        canal: regra.canal,
        formato: regra.formato,
        modeloCompra: regra.modeloCompra,
        valor: Number(regra.valor),
      }),
      motivo: 'Criação de regra de preço',
    });

    return NextResponse.json({
      success: true,
      regra: {
        ...regra,
        valor: Number(regra.valor),
        faixaMin: regra.faixaMin == null ? null : Number(regra.faixaMin),
        faixaMax: regra.faixaMax == null ? null : Number(regra.faixaMax),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao criar regra de preço:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar regra de preço' },
      { status: 500 }
    );
  }
}
