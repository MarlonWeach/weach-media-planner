/**
 * Gerador de PDF - Weach Pricing & Media Recommender
 * 
 * Gera PDF comercial com identidade visual Weach
 */

import PDFDocument from 'pdfkit/js/pdfkit.standalone';
import fs from 'fs';

// Cores da identidade visual Weach
const CORES = {
  PRIMARY: '#2E5FF2',
  PRIMARY_DARK: '#1B2F59',
  GRAY: '#666666',
  GRAY_LIGHT: '#F2F2F4',
};

interface DadosCotacao {
  id: string;
  clienteNome: string;
  clienteSegmento: string;
  objetivo: string;
  budget: number;
  dataInicio: Date;
  dataFim: Date;
  regiao: string;
  explicacaoComercial?: string;
  mix: Array<{
    canal: string;
    percentual: number;
  }>;
  precos: any;
  estimativas: {
    impressoes: number;
    cliques: number;
    leads: number;
    cpmEstimado: number;
    cpcEstimado: number;
    cplEstimado: number;
  };
  vendedor: {
    nome: string;
    email: string;
  };
}

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

      // Cabeçalho
      adicionarCabecalho(doc, dados);

      // Resumo Executivo
      adicionarResumoExecutivo(doc, dados);

      // Plano de Mídia
      adicionarPlanoMidia(doc, dados);

      // Estimativas
      adicionarEstimativas(doc, dados);

      // Rodapé
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

function adicionarCabecalho(doc: PDFDocument, dados: DadosCotacao) {
  // Logo (se existir)
  // TODO: Adicionar logo quando disponível
  // const logoPath = path.join(process.cwd(), 'public', 'logo-weach.png');
  // if (fs.existsSync(logoPath)) {
  //   doc.image(logoPath, 50, 50, { width: 100 });
  // }

  // Título
  doc
    .fontSize(24)
    .fillColor(CORES.PRIMARY_DARK)
    .font('Helvetica-Bold')
    .text('Weach', 50, 50);

  doc
    .fontSize(18)
    .fillColor(CORES.GRAY)
    .font('Helvetica')
    .text('Pricing & Media Recommender', 50, 75);

  // Linha divisória
  doc
    .moveTo(50, 110)
    .lineTo(545, 110)
    .strokeColor(CORES.PRIMARY)
    .lineWidth(2)
    .stroke();

  // Título da proposta
  doc
    .fontSize(20)
    .fillColor(CORES.PRIMARY_DARK)
    .font('Helvetica-Bold')
    .text('Proposta de Plano de Mídia Digital', 50, 130, { align: 'center' });

  doc
    .fontSize(14)
    .fillColor(CORES.GRAY)
    .font('Helvetica')
    .text(`Cliente: ${dados.clienteNome}`, 50, 160, { align: 'center' });

  doc
    .fontSize(12)
    .text(
      `Período: ${formatarData(dados.dataInicio)} a ${formatarData(dados.dataFim)}`,
      50,
      180,
      { align: 'center' }
    );

  doc.moveDown(2);
}

function adicionarResumoExecutivo(
  doc: PDFDocument,
  dados: DadosCotacao
) {
  doc
    .fontSize(16)
    .fillColor(CORES.PRIMARY_DARK)
    .font('Helvetica-Bold')
    .text('Resumo Executivo', 50, doc.y);

  doc.moveDown(0.5);

  if (dados.explicacaoComercial) {
    doc
      .fontSize(11)
      .fillColor(CORES.GRAY)
      .font('Helvetica')
      .text(dados.explicacaoComercial, {
        width: 495,
        align: 'justify',
      });
  } else {
    doc
      .fontSize(11)
      .fillColor(CORES.GRAY)
      .font('Helvetica')
      .text(
        `Esta proposta foi desenvolvida para ${dados.clienteNome} no segmento ${formatarSegmento(dados.clienteSegmento)}, com foco em ${formatarObjetivo(dados.objetivo)}.`,
        {
          width: 495,
          align: 'justify',
        }
      );
  }

  doc.moveDown(1.5);
}

function adicionarPlanoMidia(doc: PDFDocument, dados: DadosCotacao) {
  doc
    .fontSize(16)
    .fillColor(CORES.PRIMARY_DARK)
    .font('Helvetica-Bold')
    .text('Plano de Mídia', 50, doc.y);

  doc.moveDown(0.5);

  // Cabeçalho da tabela
  const startY = doc.y;
  const colWidths = [95, 55, 85, 90, 95, 75];
  const rowHeight = 25;

  // Cabeçalho
  doc
    .fontSize(10)
    .fillColor(CORES.PRIMARY)
    .rect(50, startY, colWidths[0], rowHeight)
    .fill();

  doc
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .text('Canal', 55, startY + 8);

  doc
    .fillColor(CORES.PRIMARY)
    .rect(145, startY, colWidths[1], rowHeight)
    .fill();

  doc
    .fillColor('#FFFFFF')
    .text('%', 150, startY + 8);

  doc
    .fillColor(CORES.PRIMARY)
    .rect(200, startY, colWidths[2], rowHeight)
    .fill();

  doc
    .fillColor('#FFFFFF')
    .text('Budget', 205, startY + 8);

  doc
    .fillColor(CORES.PRIMARY)
    .rect(285, startY, colWidths[3], rowHeight)
    .fill();

  doc
    .fillColor('#FFFFFF')
    .text('Modelo', 290, startY + 8);

  doc
    .fillColor(CORES.PRIMARY)
    .rect(375, startY, colWidths[4], rowHeight)
    .fill();

  doc
    .fillColor('#FFFFFF')
    .text('Preço Unit.', 380, startY + 8);

  doc
    .fillColor(CORES.PRIMARY)
    .rect(470, startY, colWidths[5], rowHeight)
    .fill();

  doc
    .fillColor('#FFFFFF')
    .text('Entrega', 475, startY + 8);

  // Linhas da tabela
  let currentY = startY + rowHeight;
  dados.mix.forEach((item, index) => {
    const valorBudget = (dados.budget * item.percentual) / 100;
    const modeloCompra = obterModeloCompra(item.canal);
    const precoUnitario = obterPrecoUnitarioCanal(item.canal, dados.precos);
    const entregaQuantidade = calcularQuantidadeEntrega(modeloCompra, valorBudget, precoUnitario);
    const entregaDescricao = obterDescricaoEntregaPorModelo(modeloCompra);

    // Alternar cor de fundo
    if (index % 2 === 0) {
      doc.rect(50, currentY, 495, rowHeight).fillColor(CORES.GRAY_LIGHT).fill();
    }

    doc
      .fontSize(10)
      .fillColor(CORES.GRAY)
      .font('Helvetica')
      .text(formatarNomeCanal(item.canal), 55, currentY + 8);

    doc.text(`${item.percentual.toFixed(1)}%`, 150, currentY + 8);

    doc.text(formatarMoeda(valorBudget), 205, currentY + 8);

    doc.text(modeloCompra, 290, currentY + 8);
    doc.text(formatarMoeda(precoUnitario), 380, currentY + 8);
    doc.fontSize(9).text(
      `${formatarNumero(entregaQuantidade)} ${entregaDescricao}`,
      475,
      currentY + 8,
      { width: 68 }
    );
    doc.fontSize(10);

    // Linha divisória
    doc
      .moveTo(50, currentY + rowHeight)
      .lineTo(545, currentY + rowHeight)
      .strokeColor('#CCCCCC')
      .lineWidth(0.5)
      .stroke();

    currentY += rowHeight;
  });

  // Total
  doc
    .fontSize(10)
    .fillColor(CORES.PRIMARY_DARK)
    .font('Helvetica-Bold')
    .text('TOTAL', 55, currentY + 8);

  doc.text('100%', 150, currentY + 8);

  doc.text(formatarMoeda(dados.budget), 205, currentY + 8);

  doc.y = currentY + rowHeight + 10;
}

function adicionarEstimativas(doc: PDFDocument, dados: DadosCotacao) {
  doc
    .fontSize(16)
    .fillColor(CORES.PRIMARY_DARK)
    .font('Helvetica-Bold')
    .text('Estimativas de Resultados', 50, doc.y);

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

  const estimativas = [
    ['Métrica', 'Estimativa'],
    ['Impressões', formatarNumero(dados.estimativas.impressoes)],
    ['Cliques', formatarNumero(dados.estimativas.cliques)],
    ['Leads', formatarNumero(dados.estimativas.leads)],
    ['CPM Estimado', formatarMoeda(dados.estimativas.cpmEstimado)],
    ['CPC Estimado', formatarMoeda(dados.estimativas.cpcEstimado)],
    ['CPL Estimado', formatarMoeda(dados.estimativas.cplEstimado)],
  ];

  const startY = doc.y;
  const colWidths = [250, 245];
  const rowHeight = 20;

  estimativas.forEach((row, index) => {
    const currentY = startY + index * rowHeight;

    if (index === 0) {
      // Cabeçalho
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

      doc
        .fillColor('#FFFFFF')
        .text(row[1], 305, currentY + 6);
    } else {
      // Dados
      if (index % 2 === 0) {
        doc.rect(50, currentY, 495, rowHeight).fillColor(CORES.GRAY_LIGHT).fill();
      }

      doc
        .fontSize(10)
        .fillColor(CORES.GRAY)
        .font('Helvetica')
        .text(row[0], 55, currentY + 6);

      doc
        .font('Helvetica-Bold')
        .text(row[1], 305, currentY + 6);
    }
  });

  doc.y = startY + estimativas.length * rowHeight + 10;
}

function adicionarRodape(doc: PDFDocument, dados: DadosCotacao) {
  const pageHeight = doc.page.height;
  const footerY = pageHeight - 100;

  doc
    .fontSize(10)
    .fillColor(CORES.GRAY)
    .font('Helvetica')
    .text('Próximos Passos:', 50, footerY);

  doc.moveDown(0.3);

  doc
    .fontSize(9)
    .text('1. Aprovação da proposta pelo cliente', 50, doc.y, { indent: 20 });

  doc.text('2. Envio de materiais criativos', 50, doc.y, { indent: 20 });

  doc.text('3. Início da veiculação conforme cronograma', 50, doc.y, {
    indent: 20,
  });

  doc.moveDown(0.5);

  doc
    .fontSize(10)
    .fillColor(CORES.PRIMARY_DARK)
    .font('Helvetica-Bold')
    .text('Contato:', 50, doc.y);

  doc
    .fontSize(9)
    .fillColor(CORES.GRAY)
    .font('Helvetica')
    .text(`Vendedor: ${dados.vendedor.nome}`, 50, doc.y, { indent: 20 });

  doc.text(`E-mail: ${dados.vendedor.email}`, 50, doc.y, { indent: 20 });

  doc.moveDown(0.5);

  doc
    .fontSize(8)
    .fillColor(CORES.GRAY)
    .text(
      `Documento gerado em ${formatarData(new Date())} - Weach Pricing & Media Recommender`,
      50,
      pageHeight - 30,
      { align: 'center' }
    );
}

// Funções auxiliares
function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

function formatarNumero(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
}

function formatarData(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(data);
}

function formatarSegmento(segmento: string): string {
  const nomes: Record<string, string> = {
    AUTOMOTIVO: 'Automotivo',
    FINANCEIRO: 'Financeiro',
    VAREJO: 'Varejo',
    IMOBILIARIO: 'Imobiliário',
    SAUDE: 'Saúde',
    EDUCACAO: 'Educação',
    TELECOM: 'Telecom',
    SERVICOS: 'Serviços',
    OUTROS: 'Outros',
  };
  return nomes[segmento] || segmento;
}

function formatarObjetivo(objetivo: string): string {
  const nomes: Record<string, string> = {
    AWARENESS: 'Awareness',
    CONSIDERACAO: 'Consideração',
    LEADS: 'Geração de Leads',
    VENDAS: 'Vendas',
  };
  return nomes[objetivo] || objetivo;
}

function formatarNomeCanal(canal: string): string {
  const nomes: Record<string, string> = {
    DISPLAY_PROGRAMATICO: 'Display Programático',
    VIDEO_PROGRAMATICO: 'Vídeo Programático',
    CTV: 'CTV',
    AUDIO_DIGITAL: 'Áudio Digital',
    SOCIAL_PROGRAMATICO: 'Social Programático',
    CRM_MEDIA: 'CRM Media',
    IN_LIVE: 'In Live',
    CPL_CPI: 'CPL/CPI',
  };
  return nomes[canal] || canal.replace(/_/g, ' ');
}

function obterModeloCompra(canal: string): string {
  const modelos: Record<string, string> = {
    DISPLAY_PROGRAMATICO: 'CPM',
    VIDEO_PROGRAMATICO: 'CPV',
    CTV: 'CPV',
    AUDIO_DIGITAL: 'CPM',
    SOCIAL_PROGRAMATICO: 'CPC',
    CRM_MEDIA: 'CPD',
    IN_LIVE: 'CPM',
    CPL_CPI: 'CPL',
  };
  return modelos[canal] || 'CPM';
}

function obterPrecoUnitarioCanal(canal: string, precos: any): number {
  if (canal === 'DISPLAY_PROGRAMATICO') return Number(precos?.display?.cpmBase ?? 4);
  if (canal === 'VIDEO_PROGRAMATICO') return Number(precos?.video?.cpvVideo30 ?? 0.04);
  if (canal === 'CTV') return Number(precos?.ctv?.cpvCtv30Open ?? 0.04);
  if (canal === 'AUDIO_DIGITAL') return Number(precos?.audio?.spotifyAudioCpm ?? 47);
  if (canal === 'SOCIAL_PROGRAMATICO') return Number(precos?.social?.fbTrafego ?? 2.5);
  if (canal === 'CRM_MEDIA') return 0.6;
  if (canal === 'IN_LIVE') return 6;
  if (canal === 'CPL_CPI') return 50;
  return 1;
}

function obterDescricaoEntregaPorModelo(modeloCompra: string): string {
  const mapaDescricao: Record<string, string> = {
    CPM: 'impressões',
    CPC: 'cliques',
    CPV: 'complete views',
    CPL: 'leads',
    CPI: 'instalações',
    CPA: 'aquisições',
    CPD: 'disparos',
    CPE: 'engajamentos',
  };
  return mapaDescricao[modeloCompra] || 'entregas';
}

function calcularQuantidadeEntrega(
  modeloCompra: string,
  valorBudget: number,
  precoUnitario: number
): number {
  if (!Number.isFinite(precoUnitario) || precoUnitario <= 0) return 0;
  if (modeloCompra === 'CPM') {
    return Math.round((valorBudget / precoUnitario) * 1000);
  }
  return Math.round(valorBudget / precoUnitario);
}

