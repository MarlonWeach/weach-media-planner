import fs from 'fs';
import path from 'path';

const CANDIDATOS_LOGO = [
  path.join(process.cwd(), 'public', 'branding', 'weach-negative.png'),
  path.join(process.cwd(), 'public', 'weach-negative.png'),
];

export function caminhoLogoWeach(): string | null {
  for (const candidato of CANDIDATOS_LOGO) {
    if (fs.existsSync(candidato)) return candidato;
  }
  return null;
}

/** Lê largura/altura do IHDR de um PNG (sem dependências externas). */
export function dimensoesPngBuffer(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 24 || buf[0] !== 0x89 || buf.toString('ascii', 1, 4) !== 'PNG') {
    return null;
  }
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

export function dimensoesPng(filePath: string): { width: number; height: number } | null {
  try {
    return dimensoesPngBuffer(fs.readFileSync(filePath));
  } catch {
    return null;
  }
}

/** Conteúdo do PNG da logo (para PDFKit no Next — não passar path ao pdfkit). */
export function lerBufferLogoWeach(): Buffer | null {
  const caminho = caminhoLogoWeach();
  if (!caminho) return null;
  try {
    return fs.readFileSync(caminho);
  } catch {
    return null;
  }
}

/** Escala o logo para caber no rectângulo máximo mantendo proporção. */
export function calcularTamanhoLogoPreservandoProporcao(
  filePathOrBuffer: string | Buffer,
  opts: { maxWidthPx: number; maxHeightPx: number }
): { width: number; height: number } | null {
  const dims =
    typeof filePathOrBuffer === 'string'
      ? dimensoesPng(filePathOrBuffer)
      : dimensoesPngBuffer(filePathOrBuffer);
  if (!dims?.width || !dims?.height) return null;
  const scale = Math.min(
    opts.maxWidthPx / dims.width,
    opts.maxHeightPx / dims.height,
    1
  );
  return {
    width: Math.max(1, Math.round(dims.width * scale)),
    height: Math.max(1, Math.round(dims.height * scale)),
  };
}

/** px (96 DPI) → pontos PDF (72 DPI). */
export function pxParaPontosPdf(px: number): number {
  return (px * 72) / 96;
}

/** Posição do logo no plano .xlsx (Formato imagem → canto sup. esq.). */
export const LOGO_EXCEL_ESQUERDA_POL = 1;
export const LOGO_EXCEL_SUPERIOR_POL = 1.04;
