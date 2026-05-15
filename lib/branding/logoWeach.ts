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
export function dimensoesPng(filePath: string): { width: number; height: number } | null {
  try {
    const buf = fs.readFileSync(filePath);
    if (buf.length < 24 || buf[0] !== 0x89 || buf.toString('ascii', 1, 4) !== 'PNG') {
      return null;
    }
    return {
      width: buf.readUInt32BE(16),
      height: buf.readUInt32BE(20),
    };
  } catch {
    return null;
  }
}

/** Escala o logo para caber no rectângulo máximo mantendo proporção. */
export function calcularTamanhoLogoPreservandoProporcao(
  filePath: string,
  opts: { maxWidthPx: number; maxHeightPx: number }
): { width: number; height: number } | null {
  const dims = dimensoesPng(filePath);
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
