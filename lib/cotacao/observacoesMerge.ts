/**
 * Mescla dados do passo 1 no JSON de `wp_Cotacao.observacoes` sem apagar
 * estratégia, cobertura ou histórico de performance já persistidos.
 */

function parseObservacoesPayload(raw: string | null | undefined): Record<string, unknown> {
  if (!raw || typeof raw !== 'string') return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    const trimmed = raw.trim();
    return trimmed ? { solicitacao: { observacoesGerais: trimmed } } : {};
  }
}

export function mergeObservacoesComStep1(
  observacoesAtual: string | null | undefined,
  step1: Record<string, unknown>
): string {
  const payload = parseObservacoesPayload(observacoesAtual);
  const solicitacaoAtualRaw = payload.solicitacao;
  const solicitacaoAtual =
    solicitacaoAtualRaw &&
    typeof solicitacaoAtualRaw === 'object' &&
    !Array.isArray(solicitacaoAtualRaw)
      ? { ...(solicitacaoAtualRaw as Record<string, unknown>) }
      : {};

  const observacoesGeraisFromForm =
    step1.observacoesGerais !== undefined && step1.observacoesGerais !== null
      ? String(step1.observacoesGerais)
      : step1.observacoes !== undefined && step1.observacoes !== null
        ? String(step1.observacoes)
        : undefined;

  const rawAnexo = step1.anexoDriveLink;
  const anexoDriveLink =
    rawAnexo !== undefined && rawAnexo !== null
      ? String(rawAnexo).trim()
      : String(solicitacaoAtual.anexoDriveLink ?? '').trim();

  payload.solicitacao = {
    ...solicitacaoAtual,
    solicitanteId: step1.solicitanteId ?? solicitacaoAtual.solicitanteId,
    solicitante: step1.solicitanteNome ?? solicitacaoAtual.solicitante,
    solicitanteEmail: step1.solicitanteEmail ?? solicitacaoAtual.solicitanteEmail,
    dataSolicitacao: step1.dataSolicitacao ?? solicitacaoAtual.dataSolicitacao,
    anuncianteCampanha: step1.anuncianteCampanha ?? solicitacaoAtual.anuncianteCampanha,
    urlLp: step1.urlLp ?? solicitacaoAtual.urlLp,
    agenciaId: step1.agenciaId ?? solicitacaoAtual.agenciaId,
    agencia: step1.agenciaNome ?? solicitacaoAtual.agencia,
    cotacaoProativa:
      typeof step1.cotacaoProativa === 'boolean'
        ? step1.cotacaoProativa
        : Boolean(solicitacaoAtual.cotacaoProativa),
    anexoDriveLink,
    observacoesGerais:
      observacoesGeraisFromForm !== undefined
        ? observacoesGeraisFromForm
        : String(solicitacaoAtual.observacoesGerais ?? ''),
  };

  return JSON.stringify(payload, null, 2);
}
