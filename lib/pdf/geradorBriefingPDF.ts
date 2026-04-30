import PDFDocument from 'pdfkit/js/pdfkit.standalone';
import fs from 'fs';

type PDFKitDocument = InstanceType<typeof PDFDocument>;

const CORES = {
  PRIMARY: '#2E5FF2',
  PRIMARY_DARK: '#1B2F59',
  GRAY: '#666666',
  GRAY_LIGHT: '#F2F2F4',
};

interface DadosBriefingPDF {
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

      doc.fontSize(20).fillColor(CORES.PRIMARY_DARK).font('Helvetica-Bold').text('Weach');
      doc
        .fontSize(12)
        .fillColor(CORES.GRAY)
        .font('Helvetica')
        .text('Briefing da Cotação (Espelho de Perguntas e Respostas)');
      doc.moveDown(0.5);
      doc
        .moveTo(40, doc.y)
        .lineTo(555, doc.y)
        .strokeColor(CORES.PRIMARY)
        .lineWidth(1.5)
        .stroke();
      doc.moveDown(0.8);

      const rows: Array<[string, string]> = [
        ['ID da Cotação', safe(dados.cotacaoId)],
        ['Nome do Anunciante / Campanha', safe(dados.clienteNome)],
        ['Segmento', safe(dados.clienteSegmento)],
        ['Objetivo', safe(dados.objetivo)],
        ['Budget', formatarMoeda(dados.budget)],
        ['Região', safe(dados.regiao)],
        [
          'Definição de Campanha',
          dados.definicaoCampanha.length > 0 ? dados.definicaoCampanha.join(', ') : 'Não informada',
        ],
        ['Cotação é pró-ativa?', dados.cotacaoProativa ? 'Sim' : 'Não'],
        ['Solicitante', safe(dados.solicitanteNome)],
        ['E-mail do Solicitante', safe(dados.solicitanteEmail)],
        ['Agência', safe(dados.agenciaNome, 'Não informada')],
        ['Observações Gerais', safe(dados.observacoesGerais, 'Sem observações.')],
      ];

      const startX = 40;
      const widthLabel = 200;
      const widthValue = 315;
      let currentY = doc.y;

      rows.forEach(([label, value], index) => {
        garantirEspaco(doc, 28);
        currentY = doc.y;
        const bgColor = index % 2 === 0 ? CORES.GRAY_LIGHT : '#FFFFFF';

        doc.rect(startX, currentY, widthLabel, 24).fillColor(bgColor).fill();
        doc.rect(startX + widthLabel, currentY, widthValue, 24).fillColor(bgColor).fill();
        doc.rect(startX, currentY, widthLabel + widthValue, 24).lineWidth(0.5).strokeColor('#D1D5DB').stroke();

        doc
          .fontSize(9)
          .fillColor('#111827')
          .font('Helvetica-Bold')
          .text(label, startX + 6, currentY + 7, { width: widthLabel - 12, ellipsis: true });

        doc
          .fontSize(9)
          .fillColor('#111827')
          .font('Helvetica')
          .text(value, startX + widthLabel + 6, currentY + 7, { width: widthValue - 12, ellipsis: true });

        doc.y = currentY + 24;
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
