import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function criarPrismaClient() {
  return new PrismaClient({
    log: ['error', 'warn'],
  });
}

let prisma = globalForPrisma.prisma ?? criarPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  // Em dev, ao alterar schema/modelos sem restart,
  // o singleton pode manter um client antigo em memória.
  const clientDesatualizado = typeof (prisma as any).wp_MargemMinima === 'undefined';
  if (clientDesatualizado) {
    prisma = criarPrismaClient();
  }
  globalForPrisma.prisma = prisma;
}

export { prisma };

