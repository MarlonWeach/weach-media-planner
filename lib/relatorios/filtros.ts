import type { Prisma } from '@prisma/client';
import type { FiltrosRelatorio } from '@/lib/relatorios/types';
import { montarClausulaFiltroComercial } from '@/lib/relatorios/filtroComercial';
import {
  fimDiaBr,
  inicioDiaBr,
  periodoMesAnteriorStrings,
} from '@/lib/relatorios/periodo';

export function parseFiltrosRelatorioFromSearchParams(
  params: URLSearchParams,
  opcoes?: { aplicarPeriodoPadrao?: boolean }
): FiltrosRelatorio {
  const dataInicioRaw = params.get('dataInicio');
  const dataFimRaw = params.get('dataFim');
  const segmento = params.get('segmento');
  const solicitanteId = params.get('solicitanteId');
  const status = params.get('status');

  let dataInicio = dataInicioRaw;
  let dataFim = dataFimRaw;

  const aplicarPadrao = opcoes?.aplicarPeriodoPadrao !== false;
  if (aplicarPadrao && !dataInicio && !dataFim) {
    const padrao = periodoMesAnteriorStrings();
    dataInicio = padrao.dataInicio;
    dataFim = padrao.dataFim;
  }

  return {
    ...(dataInicio
      ? { dataInicio: inicioDiaBr(dataInicio), dataInicioLabel: dataInicio }
      : {}),
    ...(dataFim ? { dataFim: fimDiaBr(dataFim), dataFimLabel: dataFim } : {}),
    ...(segmento ? { segmento: segmento as FiltrosRelatorio['segmento'] } : {}),
    ...(solicitanteId ? { solicitanteId } : {}),
    ...(status ? { status: status as FiltrosRelatorio['status'] } : {}),
  };
}

export async function montarWhereCotacaoRelatorio(
  filtros: FiltrosRelatorio,
  userId: string,
  visaoGlobal: boolean
): Promise<Prisma.wp_CotacaoWhereInput> {
  const where: Prisma.wp_CotacaoWhereInput = {
    // Não usar startsWith('__'): em SQL LIKE o "_" é curinga e excluiria todas as linhas.
    NOT: { clienteNome: '__CONFIG_SYSTEM__' },
  };

  if (!visaoGlobal) {
    where.vendedorId = userId;
  } else if (filtros.solicitanteId) {
    const clausulaComercial = await montarClausulaFiltroComercial(filtros.solicitanteId);
    Object.assign(where, clausulaComercial);
  }

  if (filtros.segmento) {
    where.clienteSegmento = filtros.segmento;
  }
  if (filtros.status) {
    where.status = filtros.status;
  }
  if (filtros.dataInicio || filtros.dataFim) {
    where.createdAt = {};
    if (filtros.dataInicio) {
      where.createdAt.gte = filtros.dataInicio;
    }
    if (filtros.dataFim) {
      where.createdAt.lte = filtros.dataFim;
    }
  }

  return where;
}
