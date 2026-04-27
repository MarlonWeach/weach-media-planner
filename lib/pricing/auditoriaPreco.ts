import { prisma } from '@/lib/prisma';

export async function obterOuCriarCotacaoSistema(usuarioId: string) {
  let cotacaoConfig = await prisma.wp_Cotacao.findFirst({
    where: { clienteNome: '__CONFIG_SYSTEM__' },
  });

  if (!cotacaoConfig) {
    cotacaoConfig = await prisma.wp_Cotacao.create({
      data: {
        clienteNome: '__CONFIG_SYSTEM__',
        clienteSegmento: 'OUTROS',
        urlLp: 'https://config.weach.com',
        objetivo: 'AWARENESS',
        budget: 0,
        dataInicio: new Date(),
        dataFim: new Date(),
        regiao: 'NACIONAL',
        maturidadeDigital: 'ALTA',
        risco: 'BAIXA',
        aceitaModeloHibrido: false,
        mixSugerido: {},
        precosSugeridos: {},
        estimativas: {},
        vendedorId: usuarioId,
        status: 'FINALIZADA',
      },
    });
  }

  return cotacaoConfig;
}

export async function registrarLogAlteracaoPreco(params: {
  usuarioId: string;
  campo: string;
  valorAnterior: string;
  valorNovo: string;
  motivo: string;
}) {
  const cotacaoSistema = await obterOuCriarCotacaoSistema(params.usuarioId);
  await prisma.wp_LogAlteracaoPreco.create({
    data: {
      cotacaoId: cotacaoSistema.id,
      usuarioId: params.usuarioId,
      campo: params.campo,
      valorAnterior: params.valorAnterior,
      valorNovo: params.valorNovo,
      motivo: params.motivo,
    },
  });
}
