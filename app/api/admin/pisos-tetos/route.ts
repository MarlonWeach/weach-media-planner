import { NextRequest, NextResponse } from 'next/server';
import { CanalInventario, ModeloCompra, Regiao, Role, Segmento } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { obterUsuarioDoRequest } from '@/lib/utils/auth';
import { registrarLogAlteracaoPreco } from '@/lib/pricing/auditoriaPreco';

const schemaCriarRegra = z
  .object({
    canal: z.nativeEnum(CanalInventario),
    segmento: z.nativeEnum(Segmento).optional(),
    regiao: z.nativeEnum(Regiao).optional(),
    formato: z.string().optional(),
    modeloCompra: z.nativeEnum(ModeloCompra),
    precoMin: z.coerce.number().nonnegative(),
    precoAlvo: z.coerce.number().nonnegative(),
    precoMax: z.coerce.number().nonnegative(),
    ativo: z.boolean().optional(),
  })
  .refine((data) => data.precoMin <= data.precoAlvo && data.precoAlvo <= data.precoMax, {
    message: 'Consistência inválida: precoMin <= precoAlvo <= precoMax',
    path: ['precoMax'],
  });

const seedInicialPisosTetos = [
  {
    canal: 'DISPLAY_PROGRAMATICO' as CanalInventario,
    segmento: 'VAREJO' as Segmento,
    regiao: 'NACIONAL' as Regiao,
    formato: 'CPM Base',
    modeloCompra: 'CPM' as ModeloCompra,
    precoMin: 3.2,
    precoAlvo: 4.0,
    precoMax: 5.75,
    ativo: true,
  },
  {
    canal: 'VIDEO_PROGRAMATICO' as CanalInventario,
    segmento: 'VAREJO' as Segmento,
    regiao: 'NACIONAL' as Regiao,
    formato: 'Vídeo 30" - CPCV',
    modeloCompra: 'CPV' as ModeloCompra,
    precoMin: 0.0278,
    precoAlvo: 0.0348,
    precoMax: 0.048,
    ativo: true,
  },
  {
    canal: 'CTV' as CanalInventario,
    segmento: 'VAREJO' as Segmento,
    regiao: 'NACIONAL' as Regiao,
    formato: 'Globo FAST CPCV',
    modeloCompra: 'CPV' as ModeloCompra,
    precoMin: 0.15,
    precoAlvo: 0.17,
    precoMax: 0.25,
    ativo: true,
  },
  {
    canal: 'AUDIO_DIGITAL' as CanalInventario,
    segmento: 'VAREJO' as Segmento,
    regiao: 'NACIONAL' as Regiao,
    formato: 'Spotify Audio',
    modeloCompra: 'CPM' as ModeloCompra,
    precoMin: 37.6,
    precoAlvo: 47.0,
    precoMax: 60.0,
    ativo: true,
  },
  {
    canal: 'SOCIAL_PROGRAMATICO' as CanalInventario,
    segmento: 'VAREJO' as Segmento,
    regiao: 'NACIONAL' as Regiao,
    formato: 'LinkedIn Sponsored',
    modeloCompra: 'CPM' as ModeloCompra,
    precoMin: 72.0,
    precoAlvo: 90.0,
    precoMax: 110.0,
    ativo: true,
  },
];

async function garantirSeedInicialPisosTetos() {
  for (const regra of seedInicialPisosTetos) {
    const existente = await prisma.wp_PrecoBase.findFirst({
      where: {
        canal: regra.canal,
        segmento: regra.segmento,
        regiao: regra.regiao,
        formato: regra.formato,
        modeloCompra: regra.modeloCompra,
      },
      select: { id: true },
    });
    if (!existente) {
      await prisma.wp_PrecoBase.create({ data: regra });
    }
  }
}

function calcularFaixaGovernanca(valorAlvo: number) {
  return {
    precoMin: Number((valorAlvo * 0.8).toFixed(4)),
    precoAlvo: Number(valorAlvo.toFixed(4)),
    precoMax: Number((valorAlvo * 1.25).toFixed(4)),
  };
}

async function backfillPisosTetosPorRegrasAtivas() {
  const regrasAtivas = await prisma.wp_ValorFixoPreco.findMany({
    where: { ativo: true },
    orderBy: [{ canal: 'asc' }, { ordem: 'asc' }],
    select: {
      canal: true,
      formato: true,
      modeloCompra: true,
      valor: true,
    },
  });

  for (const regra of regrasAtivas) {
    if (regra.canal === 'IN_LIVE' && regra.formato === 'Display Geofence 3km') continue;

    const valorAlvo = Number(regra.valor);
    if (!Number.isFinite(valorAlvo) || valorAlvo <= 0) continue;

    const existente = await prisma.wp_PrecoBase.findFirst({
      where: {
        canal: regra.canal,
        segmento: 'VAREJO',
        regiao: 'NACIONAL',
        formato: regra.formato ?? undefined,
        modeloCompra: regra.modeloCompra,
      },
      select: { id: true },
    });
    if (existente) continue;

    const faixa = calcularFaixaGovernanca(valorAlvo);
    await prisma.wp_PrecoBase.create({
      data: {
        canal: regra.canal,
        segmento: 'VAREJO',
        regiao: 'NACIONAL',
        formato: regra.formato,
        modeloCompra: regra.modeloCompra,
        precoMin: faixa.precoMin,
        precoAlvo: faixa.precoAlvo,
        precoMax: faixa.precoMax,
        ativo: true,
      },
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const usuario = obterUsuarioDoRequest(request.headers);
    if (!usuario || usuario.role !== Role.ADMIN) {
      return NextResponse.json({ success: false, error: 'Acesso negado.' }, { status: 403 });
    }

    await garantirSeedInicialPisosTetos();
    await backfillPisosTetosPorRegrasAtivas();

    const ativo = request.nextUrl.searchParams.get('ativo');
    const where: any = {};
    if (ativo === 'true' || ativo === 'false') where.ativo = ativo === 'true';

    const regras = await prisma.wp_PrecoBase.findMany({
      where,
      orderBy: [{ canal: 'asc' }, { modeloCompra: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      regras: regras.map((item) => ({
        ...item,
        precoMin: Number(item.precoMin),
        precoAlvo: Number(item.precoAlvo),
        precoMax: Number(item.precoMax),
      })),
    });
  } catch (error) {
    console.error('Erro ao listar pisos e tetos:', error);
    return NextResponse.json({ success: false, error: 'Erro ao listar pisos e tetos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const usuario = obterUsuarioDoRequest(request.headers);
    if (!usuario || usuario.role !== Role.ADMIN) {
      return NextResponse.json({ success: false, error: 'Acesso negado.' }, { status: 403 });
    }

    const dados = schemaCriarRegra.parse(await request.json());
    const regra = await prisma.wp_PrecoBase.create({ data: { ...dados, ativo: dados.ativo ?? true } });

    await registrarLogAlteracaoPreco({
      usuarioId: usuario.userId,
      campo: 'PISO_TETO_CREATE',
      valorAnterior: '-',
      valorNovo: JSON.stringify({
        id: regra.id,
        canal: regra.canal,
        modeloCompra: regra.modeloCompra,
        precoMin: Number(regra.precoMin),
        precoAlvo: Number(regra.precoAlvo),
        precoMax: Number(regra.precoMax),
      }),
      motivo: 'Criação de piso/teto',
    });

    return NextResponse.json({
      success: true,
      regra: {
        ...regra,
        precoMin: Number(regra.precoMin),
        precoAlvo: Number(regra.precoAlvo),
        precoMax: Number(regra.precoMax),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', details: error.issues }, { status: 400 });
    }
    console.error('Erro ao criar piso/teto:', error);
    return NextResponse.json({ success: false, error: 'Erro ao criar piso/teto' }, { status: 500 });
  }
}
