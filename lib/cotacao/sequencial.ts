import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
const CHAVE_CONFIGURACAO = 'COTACAO_SEQUENCIAL_POR_ANO';
const ADVISORY_LOCK_ID = 9000001;

interface ContadorAnual {
  current: number;
  seedApplied: number;
}

interface SequencialPorAnoPayload {
  byYear: Record<string, ContadorAnual>;
  updatedAt: string;
}

export function obterAnoSequencialPadrao(data = new Date()): number {
  return data.getFullYear();
}

function chaveAno(ano: number): string {
  return String(ano);
}

function parseSeedInicialAno(ano: number): number {
  const envKey = `COTACAO_SEQUENCIAL_SEED_${ano}`;
  const raw = process.env[envKey] ?? process.env.COTACAO_SEQUENCIAL_SEED;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.floor(parsed);
}

function parsePayloadPorAno(valor: unknown): SequencialPorAnoPayload {
  if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
    const raw = valor as Partial<SequencialPorAnoPayload>;
    const byYear: Record<string, ContadorAnual> = {};
    if (raw.byYear && typeof raw.byYear === 'object') {
      for (const [year, entry] of Object.entries(raw.byYear)) {
        const current = Number((entry as ContadorAnual)?.current);
        const seedApplied = Number((entry as ContadorAnual)?.seedApplied);
        if (Number.isFinite(current) && current >= 0) {
          byYear[year] = {
            current: Math.floor(current),
            seedApplied:
              Number.isFinite(seedApplied) && seedApplied >= 0
                ? Math.floor(seedApplied)
                : 0,
          };
        }
      }
    }
    return {
      byYear,
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
    };
  }

  return { byYear: {}, updatedAt: new Date().toISOString() };
}

function obterContadorAno(
  payload: SequencialPorAnoPayload,
  ano: number
): ContadorAnual {
  const key = chaveAno(ano);
  const existente = payload.byYear[key];
  if (existente) return existente;
  const seed = parseSeedInicialAno(ano);
  return { current: seed, seedApplied: seed };
}

/**
 * Gera o próximo ID de cotação (ex.: `2026-1`, `2026-2`).
 * Esse valor é a chave primária (`wp_Cotacao.id`).
 */
export async function obterProximoIdCotacao(anoReferencia?: number): Promise<string> {
  const ano = anoReferencia ?? obterAnoSequencialPadrao();

  const { numeroSequencial } = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${ADVISORY_LOCK_ID})`);

    let config = await tx.wp_Configuracao.findUnique({
      where: { chave: CHAVE_CONFIGURACAO },
      select: { id: true, valor: true },
    });

    if (!config) {
      const seed = parseSeedInicialAno(ano);
      const valorInicial: Prisma.InputJsonValue = {
        byYear: { [chaveAno(ano)]: { current: seed, seedApplied: seed } },
        updatedAt: new Date().toISOString(),
      };
      config = await tx.wp_Configuracao.create({
        data: {
          chave: CHAVE_CONFIGURACAO,
          descricao: 'Contador sequencial por ano das cotações (PBI-9)',
          valor: valorInicial,
          ativo: true,
        },
        select: { id: true, valor: true },
      });
    }

    const payload = parsePayloadPorAno(config.valor);
    const contadorAno = obterContadorAno(payload, ano);
    const proximaSequencia = contadorAno.current + 1;

    await tx.wp_Configuracao.update({
      where: { id: config.id },
      data: {
        valor: {
          byYear: {
            ...payload.byYear,
            [chaveAno(ano)]: {
              current: proximaSequencia,
              seedApplied: contadorAno.seedApplied,
            },
          },
          updatedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });

    return { numeroSequencial: proximaSequencia };
  });

  return `${ano}-${numeroSequencial}`;
}
