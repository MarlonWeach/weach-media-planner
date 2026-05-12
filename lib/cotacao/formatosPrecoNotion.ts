/**
 * Formatos cujo preço não vem do motor automático e deve ser consultado na base comercial (Notion Weach).
 */

export const MENSAGEM_PRECO_NOTION =
  'Consulte o valor no Notion Weach.';

/** CPV HBO/MAX, Netflix e Disney+ — sem precificação automática no sistema. */
export function formatoCpvStreamersApenasNotion(formato: string): boolean {
  const f = formato.toLowerCase().trim();
  if (f.includes('hbo')) return true;
  if (f.includes('disney')) return true;
  if (f.includes('netflix')) return true;
  return false;
}

/**
 * TikTok CPM (R$) conforme planilha: =SE(D3=4;15;SE(D3=5;16;SE(D3=7;17;SE(D3=8;18;SE(D3=9;20;"")))))
 * D3 = CPM base regional aplicado ao motor (mesmo referencial das outras regras condicionais).
 */
export function calcularTikTokCpmPorD3(cpmBase: number): number | null {
  if (cpmBase === 4) return 15;
  if (cpmBase === 5) return 16;
  if (cpmBase === 7) return 17;
  if (cpmBase === 8) return 18;
  if (cpmBase === 9) return 20;
  return null;
}
