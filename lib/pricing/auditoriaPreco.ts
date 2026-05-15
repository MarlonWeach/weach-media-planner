import { prisma } from '@/lib/prisma';

/** ID fixo para cotação “fantasma” usada apenas em logs de auditoria de preço (exige PK após PBI-9). */
const COTACAO_SISTEMA_AUDITORIA_ID = '00000000-0000-4000-8000-000000000001';

export async function obterOuCriarCotacaoSistema(usuarioId: string) {
  let cotacaoConfig = await prisma.wp_Cotacao.findFirst({
    where: { id: COTACAO_SISTEMA_AUDITORIA_ID },
  });

  if (!cotacaoConfig) {
    cotacaoConfig = await prisma.wp_Cotacao.create({
      data: {
        id: COTACAO_SISTEMA_AUDITORIA_ID,
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
