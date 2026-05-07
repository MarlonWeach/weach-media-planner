import { prisma } from '@/lib/prisma';

const CHAVE_CONFIGURACAO = 'COTACAO_SEQUENCIAL_CONTADOR';
const ADVISORY_LOCK_ID = 9000001;

interface SequencialPayload {
  current: number;
  seedApplied: number;
  updatedAt: string;
}

function parseSeedInicialLegado(): number {
  const raw = process.env.COTACAO_SEQUENCIAL_SEED;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.floor(parsed);
}

function parseValorConfiguracao(valor: unknown, fallbackSeed: number): SequencialPayload {
  if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
    const payload = valor as Partial<SequencialPayload>;
    const current = Number(payload.current);
    const seedApplied = Number(payload.seedApplied);
    if (Number.isFinite(current) && current >= 0) {
      return {
        current: Math.floor(current),
        seedApplied: Number.isFinite(seedApplied) && seedApplied >= 0 ? Math.floor(seedApplied) : fallbackSeed,
        updatedAt: typeof payload.updatedAt === 'string' ? payload.updatedAt : new Date().toISOString(),
      };
    }
  }

  return {
    current: fallbackSeed,
    seedApplied: fallbackSeed,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Task 9-2: Gera próximo número sequencial operacional de cotação.
 * Usa lock transacional no Postgres para evitar colisão em concorrência.
 */
export async function obterProximoNumeroSequencialCotacao(): Promise<number> {
  const seedInicialLegado = parseSeedInicialLegado();

  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${ADVISORY_LOCK_ID})`);

    let config = await tx.wp_Configuracao.findUnique({
      where: { chave: CHAVE_CONFIGURACAO },
      select: { id: true, valor: true },
    });

    if (!config) {
      config = await tx.wp_Configuracao.create({
        data: {
          chave: CHAVE_CONFIGURACAO,
          descricao: 'Contador sequencial operacional das cotações (PBI-9)',
          valor: {
            current: seedInicialLegado,
            seedApplied: seedInicialLegado,
            updatedAt: new Date().toISOString(),
          },
          ativo: true,
        },
        select: { id: true, valor: true },
      });
    }

    const payloadAtual = parseValorConfiguracao(config.valor, seedInicialLegado);
    const proximoNumero = payloadAtual.current + 1;

    await tx.wp_Configuracao.update({
      where: { id: config.id },
      data: {
        valor: {
          ...payloadAtual,
          current: proximoNumero,
          updatedAt: new Date().toISOString(),
        },
      },
    });

    return proximoNumero;
  });
}

