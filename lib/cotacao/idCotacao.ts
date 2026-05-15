/** ID de cotação no formato operacional (ex.: `2026-1`). */
export const ID_COTACAO_OPERACIONAL_REGEX = /^\d{4}-\d+$/;

/** UUID legado (cotações criadas antes da unificação do ID). */
export const ID_COTACAO_UUID_LEGACY_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isIdCotacaoOperacional(id: string): boolean {
  return ID_COTACAO_OPERACIONAL_REGEX.test(id.trim());
}

export function isIdCotacaoUuidLegado(id: string): boolean {
  return ID_COTACAO_UUID_LEGACY_REGEX.test(id.trim());
}

/** Aceita ID operacional ou UUID legado (rotas e APIs). */
export function isIdCotacaoValido(id: string): boolean {
  const normalized = id.trim();
  return isIdCotacaoOperacional(normalized) || isIdCotacaoUuidLegado(normalized);
}

export function idCotacaoParaColunaSheets(id: string): string {
  return isIdCotacaoOperacional(id) ? id : '';
}
