import { normalizarCidadesParaExibicao } from '@/lib/utils/cidades';

export interface ObservacaoPayload {
  solicitacao?: {
    solicitante?: string;
    solicitanteEmail?: string;
    agencia?: string;
    cotacaoProativa?: boolean;
    observacoesGerais?: string;
  };
  estrategia?: {
    definicaoCampanha?: string[];
  };
  cobertura?: {
    tipoRegiao?: string;
    estadosSelecionados?: string[];
    cidades?: string;
  };
  workflowPerformance?: {
    queueEmailMessageId?: string;
  };
}

export function extrairPayloadObservacoes(observacoes: string | null): ObservacaoPayload | null {
  if (!observacoes) return null;
  try {
    const parsed = JSON.parse(observacoes) as ObservacaoPayload;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function montarRegiaoExibicao(
  regiaoTecnica: string,
  payloadObs: ObservacaoPayload | null
): string {
  const cobertura = payloadObs?.cobertura;
  if (!cobertura) return regiaoTecnica;

  const tipoRegiao = String(cobertura.tipoRegiao || '').toUpperCase();
  if (tipoRegiao === 'CIDADES') {
    const cidades = String(cobertura.cidades || '').trim();
    return cidades.length > 0 ? normalizarCidadesParaExibicao(cidades) : regiaoTecnica;
  }
  if (tipoRegiao === 'ESTADO') {
    const estados = Array.isArray(cobertura.estadosSelecionados)
      ? cobertura.estadosSelecionados.filter(Boolean)
      : [];
    return estados.length > 0 ? estados.join(', ') : regiaoTecnica;
  }
  return regiaoTecnica;
}
