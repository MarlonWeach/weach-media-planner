/**
 * Nomes de arquivo do plano de mídia: cotacao-<campanha>-<id>-plano-midia.
 * Campanha sanitizada (espaços → _, caracteres inválidos removidos/substituídos).
 */

const INVALID_FILENAME_CHARS = /[/\\?%*:|"<>]/g;

export function sanitizarNomeCampanhaParaArquivo(nomeCampanha: string): string {
  const base = (nomeCampanha || '').trim() || 'campanha';
  return base
    .replace(/\s+/g, '_')
    .replace(INVALID_FILENAME_CHARS, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 80);
}

export function montarNomeArquivoPlanoMidiaXlsx(nomeCampanha: string, cotacaoId: string): string {
  return `cotacao-${sanitizarNomeCampanhaParaArquivo(nomeCampanha)}-${cotacaoId}-plano-midia.xlsx`;
}
