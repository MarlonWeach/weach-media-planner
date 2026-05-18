import PDFDocument from 'pdfkit';
import fs from 'fs';
import {
  mesclarLinhasBriefingSemDuplicar,
  type BriefingLinha,
} from '@/lib/cotacao/briefingLinhas';
import {
  alturaFaixaCabecalhoMarinhoPt,
  desenharFaixaCabecalhoMarinho,
  desenharLogoWeachNoCabecalho,
  PDF_COR_SUBTITULO_CABECALHO,
} from '@/lib/pdf/cabecalhoWeachPdf';

type PDFKitDocument = InstanceType<typeof PDFDocument>;

const CORES = {
  PRIMARY: '#2E5FF2',
  PRIMARY_DARK: '#1B2F59',
  GRAY: '#666666',
  GRAY_LIGHT: '#F2F2F4',
};

export interface DadosBriefingPDF {
  cotacaoId: string;
  clienteNome: string;
  clienteSegmento: string;
  objetivo: string;
  budget: number;
  regiao: string;
  definicaoCampanha: string[];
  cotacaoProativa: boolean;
  solicitanteNome: string;
  solicitanteEmail: string;
  agenciaNome: string;
  observacoesGerais: string;
  /** Quando informado, inclui o espelho completo do wizard (perguntas e respostas). */
  linhasEspelho?: BriefingLinha[];
}

function safe(value: string | undefined | null, fallback = 'Não informado'): string {
  const text = String(value || '').trim();
  return text.length > 0 ? text : fallback;
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(valor) ? valor : 0);
}

function garantirEspaco(doc: PDFKitDocument, espacoNecessario: number) {
  const limiteInferior = doc.page.height - doc.page.margins.bottom;
  if (doc.y + espacoNecessario > limiteInferior) {
    doc.addPage();
  }
}

export async function gerarBriefingPDF(
  dados: DadosBriefingPDF,
  outputPath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
      });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      const margem = 40;
      const alturaFaixa = alturaFaixaCabecalhoMarinhoPt();
      desenharFaixaCabecalhoMarinho(doc, alturaFaixa);

      const logoY = 20;
      const logoAltura = desenharLogoWeachNoCabecalho(doc, {
        x: margem,
        y: logoY,
        maxWidthPx: 200,
        maxHeightPx: 40,
      });

      doc
        .fontSize(11)
        .fillColor(PDF_COR_SUBTITULO_CABECALHO)
        .font('Helvetica')
        .text(
          'Briefing da Cotação (Espelho de Perguntas e Respostas)',
          margem,
          logoY + logoAltura + 6
        );

      doc.y = alturaFaixa + 18;

      const startX = 40;
      const widthLabel = 200;
      const widthValue = 315;
      const padX = 6;
      const padY = 6;

      const linhasCompletas: Array<[string, string]> =
        dados.linhasEspelho && dados.linhasEspelho.length > 0
          ? mesclarLinhasBriefingSemDuplicar(
              [
                { label: 'ID da Cotação', value: safe(dados.cotacaoId) },
                {
                  label: 'Budget (valor na cotação)',
                  value: formatarMoeda(dados.budget),
                },
              ],
              dados.linhasEspelho
            ).map((l) => [l.label, l.value] as [string, string])
          : [
              ['ID da Cotação', safe(dados.cotacaoId)],
              ['Nome do Anunciante / Campanha', safe(dados.clienteNome)],
              ['Segmento', safe(dados.clienteSegmento)],
              ['Objetivo', safe(dados.objetivo)],
              ['Budget', formatarMoeda(dados.budget)],
              ['Região', safe(dados.regiao)],
              [
                'Definição de Campanha',
                dados.definicaoCampanha.length > 0
                  ? dados.definicaoCampanha.join(', ')
                  : 'Não informada',
              ],
              ['Cotação é pró-ativa?', dados.cotacaoProativa ? 'Sim' : 'Não'],
              ['Solicitante', safe(dados.solicitanteNome)],
              ['E-mail do Solicitante', safe(dados.solicitanteEmail)],
              ['Agência', safe(dados.agenciaNome, 'Não informada')],
              ['Observações Gerais', safe(dados.observacoesGerais, 'Sem observações.')],
            ];

      linhasCompletas.forEach(([label, value], index) => {
        doc.font('Helvetica-Bold').fontSize(9);
        const hLabel = doc.heightOfString(label, { width: widthLabel - 2 * padX });
        doc.font('Helvetica').fontSize(9);
        const hVal = doc.heightOfString(value, {
          width: widthValue - 2 * padX,
          lineGap: 2,
        });
        const rowH = Math.max(28, hLabel + padY * 2, hVal + padY * 2);

        garantirEspaco(doc, rowH + 8);
        const currentY = doc.y;
        const bgColor = index % 2 === 0 ? CORES.GRAY_LIGHT : '#FFFFFF';

        doc.rect(startX, currentY, widthLabel, rowH).fillColor(bgColor).fill();
        doc.rect(startX + widthLabel, currentY, widthValue, rowH).fillColor(bgColor).fill();
        doc
          .rect(startX, currentY, widthLabel + widthValue, rowH)
          .lineWidth(0.5)
          .strokeColor('#D1D5DB')
          .stroke();

        doc
          .fontSize(9)
          .fillColor('#111827')
          .font('Helvetica-Bold')
          .text(label, startX + padX, currentY + padY, {
            width: widthLabel - 2 * padX,
          });

        doc
          .fontSize(9)
          .fillColor('#111827')
          .font('Helvetica')
          .text(value, startX + widthLabel + padX, currentY + padY, {
            width: widthValue - 2 * padX,
            lineGap: 2,
          });

        doc.y = currentY + rowH;
      });

      doc.moveDown(0.8);
      doc
        .fontSize(8)
        .fillColor(CORES.GRAY)
        .font('Helvetica')
        .text('Documento gerado automaticamente pelo Weach Media Planner.', {
          align: 'center',
        });

      doc.end();

      stream.on('finish', () => resolve(outputPath));
      stream.on('error', (error) => reject(error));
    } catch (error) {
      reject(error);
    }
  });
}
