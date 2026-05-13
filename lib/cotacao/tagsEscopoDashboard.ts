import { resolverApenasPerformance } from '@/lib/cotacao/definicaoCampanhaCotacao';

/** Tags de escopo exibidas no dashboard (alinhadas à definição de campanha do wizard). */
export type EscopoTagId = 'PROGRAMATICA' | 'PERFORMANCE' | 'MENSAGERIA';

const ORDEM_EXIBICAO: EscopoTagId[] = ['PERFORMANCE', 'PROGRAMATICA', 'MENSAGERIA'];

export const LABEL_ESCOPO_TAG: Record<EscopoTagId, string> = {
  PERFORMANCE: 'Performance',
  PROGRAMATICA: 'Programática',
  MENSAGERIA: 'Mensageria',
};

export function listarEscopoTagsCotacao(
  observacoes: string | null,
  mixSugerido: unknown
): EscopoTagId[] {
  const { definicaoCampanha } = resolverApenasPerformance(observacoes, mixSugerido);
  const set = new Set<EscopoTagId>();
  for (const d of definicaoCampanha) {
    if (d === 'PERFORMANCE') set.add('PERFORMANCE');
    if (d === 'PROGRAMATICA') set.add('PROGRAMATICA');
    if (d === 'WHATSAPP_SMS_PUSH') set.add('MENSAGERIA');
  }
  return ORDEM_EXIBICAO.filter((id) => set.has(id));
}
