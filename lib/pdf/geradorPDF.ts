/**
 * Gerador de PDF - Weach Pricing & Media Recommender
 *
 * Gera PDF comercial com identidade visual Weach
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import type { DadosCotacao } from '@/lib/cotacao/planoMidiaTabelaComercial';
import {
  alturaFaixaCabecalhoMarinhoPt,
  desenharFaixaCabecalhoMarinho,
  desenharLogoWeachNoCabecalho,
} from '@/lib/pdf/cabecalhoWeachPdf';
import {
  construirMatrizEstimativas,
  construirTabelaPlanoMidia,
  formatarData,
  textoPeriodoCotacao,
  textoResumoExecutivo,
} from '@/lib/cotacao/planoMidiaTabelaComercial';

export type { DadosCotacao } from '@/lib/cotacao/planoMidiaTabelaComercial';

type PDFKitDocument = InstanceType<typeof PDFDocument>;

const CORES = {
  PRIMARY: '#2E5FF2',
  PRIMARY_DARK: '#1B2F59',
  GRAY: '#666666',
  GRAY_LIGHT: '#F2F2F4',
};

export async function gerarPDF(
  dados: DadosCotacao,
  outputPath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      adicionarCabecalho(doc, dados);
      adicionarResumoExecutivo(doc, dados);
      adicionarPlanoMidia(doc, dados);
      adicionarEstimativas(doc, dados);
      adicionarRodape(doc, dados);

      doc.end();

      stream.on('finish', () => {
        resolve(outputPath);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

function garantirEspaco(doc: PDFKitDocument, espacoNecessario: number) {
  const limiteInferior = doc.page.height - doc.page.margins.bottom;
  if (doc.y + espacoNecessario > limiteInferior) {
    doc.addPage();
  }
}

function adicionarCabecalho(doc: PDFKitDocument, dados: DadosCotacao) {
  const margemEsquerda = 50;
  const alturaFaixa = alturaFaixaCabecalhoMarinhoPt();

  desenharFaixaCabecalhoMarinho(doc, alturaFaixa);
  desenharLogoWeachNoCabecalho(doc, {
    x: margemEsquerda,
    y: 18,
    maxWidthPx: 220,
    maxHeightPx: 44,
  });

  const linhaY = alturaFaixa + 10;
  doc
    .moveTo(margemEsquerda, linhaY)
    .lineTo(545, linhaY)
    .strokeColor(CORES.PRIMARY)
    .lineWidth(2)
    .stroke();

  doc
    .fontSize(18)
    .fillColor(CORES.PRIMARY_DARK)
    .font('Helvetica-Bold')
    .text('Proposta de Plano de Mídia Digital', margemEsquerda, linhaY + 16, { align: 'center' });

  doc
    .fontSize(14)
    .fillColor(CORES.GRAY)
    .font('Helvetica')
    .text(`Cliente: ${dados.clienteNome}`, margemEsquerda, linhaY + 44, { align: 'center' });

  doc
    .fontSize(12)
    .text(textoPeriodoCotacao(dados.dataInicio, dados.dataFim), margemEsquerda, linhaY + 62, {
      align: 'center',
    });

  doc
    .fontSize(11)
    .fillColor(CORES.GRAY)
    .font('Helvetica-Bold')
    .text(`ID da cotação: ${dados.id}`, margemEsquerda, linhaY + 80, { align: 'center' });

  doc.y = linhaY + 100;
  doc.moveDown(0.4);
}

function adicionarResumoExecutivo(doc: PDFKitDocument, dados: DadosCotacao) {
  doc
    .fontSize(16)
    .fillColor(CORES.PRIMARY_DARK)
    .font('Helvetica-Bold')
    .text('Resumo Executivo', 50, doc.y);

  doc.moveDown(0.5);

  doc
    .fontSize(11)
    .fillColor(CORES.GRAY)
    .font('Helvetica')
    .text(textoResumoExecutivo(dados), {
      width: 495,
      align: 'justify',
    });

  doc.moveDown(1.5);
}

function adicionarPlanoMidia(doc: PDFKitDocument, dados: DadosCotacao) {
  garantirEspaco(doc, 180);
  doc
    .fontSize(16)
    .fillColor(CORES.PRIMARY_DARK)
    .font('Helvetica-Bold')
    .text('Plano de Mídia', 50, doc.y);

  doc.moveDown(0.5);

  const { colunas: colDefs, linhas, totais } = construirTabelaPlanoMidia(dados);
  const startY = doc.y;
  const rowHeight = 30;
  const totalWidth = colDefs.reduce((acc, col) => acc + col.width, 0);
  const scale = 495 / totalWidth;
  const columns = colDefs.map((col) => ({ ...col, width: col.width * scale }));

  let x = 50;
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#FFFFFF');
  columns.forEach((col) => {
    doc.fillColor(CORES.PRIMARY).rect(x, startY, col.width, rowHeight).fill();
    doc.fillColor('#FFFFFF').text(col.label, x + 2, startY + 8, {
      width: col.width - 4,
      align: col.align,
    });
    x += col.width;
  });

  let currentY = startY + rowHeight;
  linhas.forEach((rowValues, index) => {
    if (currentY + rowHeight + 30 > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      currentY = doc.page.margins.top + 10;
    }
    if (index % 2 === 0) {
      doc.rect(50, currentY, 495, rowHeight).fillColor(CORES.GRAY_LIGHT).fill();
    }
    x = 50;
    doc.fontSize(7).fillColor(CORES.GRAY).font('Helvetica');
    columns.forEach((col) => {
      doc.text(rowValues[col.key] || '-', x + 2, currentY + 7, {
        width: col.width - 4,
        align: col.align,
      });
      x += col.width;
    });
    currentY += rowHeight;
  });

  doc.fontSize(8).fillColor(CORES.PRIMARY_DARK).font('Helvetica-Bold');
  x = 50;
  columns.forEach((col) => {
    doc.text(totais[col.key] || '', x + 2, currentY + 8, {
      width: col.width - 4,
      align: col.align,
    });
    x += col.width;
  });

  doc.y = currentY + rowHeight + 8;
}

function adicionarEstimativas(doc: PDFKitDocument, dados: DadosCotacao) {
  garantirEspaco(doc, 220);
  doc
    .fontSize(16)
    .fillColor(CORES.PRIMARY_DARK)
    .font('Helvetica-Bold')
    .text('Estimativas de Resultados do Plano de Mídia Completo', 50, doc.y);

  doc.moveDown(0.5);

  doc
    .fontSize(11)
    .fillColor(CORES.GRAY)
    .font('Helvetica')
    .text(
      'Com base no plano de mídia proposto, estimamos os seguintes resultados:',
      {
        width: 495,
      }
    );

  doc.moveDown(0.5);

  const estimativas = construirMatrizEstimativas(dados);

  const startY = doc.y;
  const colWidths = [250, 245];
  const rowHeight = 20;

  estimativas.forEach((row, index) => {
    const currentY = startY + index * rowHeight;

    if (index === 0) {
      doc
        .fillColor(CORES.PRIMARY)
        .rect(50, currentY, colWidths[0], rowHeight)
        .fill();

      doc
        .fontSize(10)
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .text(row[0], 55, currentY + 6);

      doc
        .fillColor(CORES.PRIMARY)
        .rect(300, currentY, colWidths[1], rowHeight)
        .fill();

      doc.fillColor('#FFFFFF').text(row[1], 305, currentY + 6);
    } else {
      if (index % 2 === 0) {
        doc.rect(50, currentY, 495, rowHeight).fillColor(CORES.GRAY_LIGHT).fill();
      }

      doc
        .fontSize(10)
        .fillColor(CORES.GRAY)
        .font('Helvetica')
        .text(row[0], 55, currentY + 6);

      doc.font('Helvetica-Bold').text(row[1], 305, currentY + 6);
    }
  });

  doc.y = startY + estimativas.length * rowHeight + 12;
}

function adicionarRodape(doc: PDFKitDocument, dados: DadosCotacao) {
  garantirEspaco(doc, 72);
  doc
    .fontSize(10)
    .fillColor(CORES.PRIMARY_DARK)
    .font('Helvetica-Bold')
    .text('Contato comercial', 50, doc.y);
  doc
    .fontSize(9)
    .fillColor(CORES.GRAY)
    .font('Helvetica')
    .text(`Vendedor: ${dados.vendedor.nome}`, 50, doc.y + 2);
  doc.text(`E-mail: ${dados.vendedor.email}`, 50, doc.y + 1);
  doc.moveDown(0.4);
  doc
    .fontSize(8)
    .fillColor(CORES.GRAY)
    .text(`Documento gerado em ${formatarData(new Date())} - Weach Pricing & Media Recommender`, {
      align: 'center',
    });
}
