import type ExcelJS from 'exceljs';

/** Largura de coluna (unid. Excel) → pol., Calibri 10/11 (MDW 7) — alinhado ao motor do Excel. */
export function larguraColunaCharsParaPol(charWidth: number): number {
  const px = Math.floor(((256 * charWidth + Math.trunc(128 / 7)) / 256) * 7);
  return px / 96;
}

/** Altura de linha (pt) → pol. */
export function alturaLinhaPtParaPol(pt: number): number {
  return pt / 72;
}

/**
 * Converte posição em pol. (canto sup. esq. da folha) para âncora { col, row }
 * fracionária do ExcelJS (0 = coluna A / linha 1).
 */
export function calcularAncoraTlPorPol(
  ws: ExcelJS.Worksheet,
  opts: {
    esquerdaPol: number;
    superiorPol: number;
    alturaLinhaPadraoPt?: number;
    maxColunas?: number;
    maxLinhas?: number;
  }
): { col: number; row: number } {
  const alturaPadrao = opts.alturaLinhaPadraoPt ?? 15;
  const maxCol = opts.maxColunas ?? 40;
  const maxRow = opts.maxLinhas ?? 30;

  let acumPol = 0;
  let colAncora = 0;
  for (let c = 1; c <= maxCol; c += 1) {
    const charWidth = ws.getColumn(c).width ?? 8.43;
    const polCol = larguraColunaCharsParaPol(charWidth);
    if (acumPol + polCol >= opts.esquerdaPol || c === maxCol) {
      const frac = polCol > 0 ? (opts.esquerdaPol - acumPol) / polCol : 0;
      colAncora = c - 1 + Math.max(0, Math.min(1, frac));
      break;
    }
    acumPol += polCol;
  }

  acumPol = 0;
  let rowAncora = 0;
  for (let r = 1; r <= maxRow; r += 1) {
    const pt = ws.getRow(r).height ?? alturaPadrao;
    const polLin = alturaLinhaPtParaPol(pt);
    if (acumPol + polLin >= opts.superiorPol || r === maxRow) {
      const frac = polLin > 0 ? (opts.superiorPol - acumPol) / polLin : 0;
      rowAncora = r - 1 + Math.max(0, Math.min(1, frac));
      break;
    }
    acumPol += polLin;
  }

  return { col: colAncora, row: rowAncora };
}
