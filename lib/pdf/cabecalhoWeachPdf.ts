import PDFDocument from 'pdfkit';
import {
  calcularTamanhoLogoPreservandoProporcao,
  lerBufferLogoWeach,
  pxParaPontosPdf,
} from '@/lib/branding/logoWeach';

type PDFKitDocument = InstanceType<typeof PDFDocument>;

/** Azul marinho do cabeçalho Excel (`FF17375E`). */
export const PDF_AZUL_MARINHO = '#17375E';

export const PDF_COR_TEXTO_CABECALHO = '#FFFFFF';
export const PDF_COR_SUBTITULO_CABECALHO = '#D6DEE8';

/** Altura da faixa superior (pt) — acomoda logo negative + subtítulo. */
export function alturaFaixaCabecalhoMarinhoPt(): number {
  return 78;
}

export function desenharFaixaCabecalhoMarinho(
  doc: PDFKitDocument,
  alturaPt: number = alturaFaixaCabecalhoMarinhoPt()
): void {
  doc.save();
  doc.rect(0, 0, doc.page.width, alturaPt).fill(PDF_AZUL_MARINHO);
  doc.restore();
}

/** Desenha `weach-negative.png` sobre fundo escuro; devolve altura ocupada (pt). */
export function desenharLogoWeachNoCabecalho(
  doc: PDFKitDocument,
  opts: {
    x: number;
    y: number;
    maxWidthPx?: number;
    maxHeightPx?: number;
  }
): number {
  const logoBuffer = lerBufferLogoWeach();
  const maxWidthPx = opts.maxWidthPx ?? 200;
  const maxHeightPx = opts.maxHeightPx ?? 42;

  if (logoBuffer) {
    const tamanho = calcularTamanhoLogoPreservandoProporcao(logoBuffer, {
      maxWidthPx,
      maxHeightPx,
    });
    if (tamanho) {
      const alturaPt = pxParaPontosPdf(tamanho.height);
      doc.image(logoBuffer, opts.x, opts.y, {
        width: pxParaPontosPdf(tamanho.width),
        height: alturaPt,
      });
      return alturaPt;
    }
  }

  doc
    .fontSize(20)
    .fillColor(PDF_COR_TEXTO_CABECALHO)
    .font('Helvetica-Bold')
    .text('Weach', opts.x, opts.y);
  return 24;
}
