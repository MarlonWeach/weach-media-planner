/**
 * Gerador de PDF - Weach Pricing & Media Recommender
 * 
 * Gera PDF comercial com identidade visual Weach
 */

import PDFDocument from 'pdfkit/js/pdfkit.standalone';
import fs from 'fs';

type PDFKitDocument = InstanceType<typeof PDFDocument>;

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
    formato?: string;
    modeloCompra?: string;
    valorBudget?: number;
    precoUnitario?: number;
    entregaEstimada?: number;
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

function garantirEspaco(doc: PDFKitDocument, espacoNecessario: number) {
  const limiteInferior = doc.page.height - doc.page.margins.bottom;
  if (doc.y + espacoNecessario > limiteInferior) {
    doc.addPage();
  }
}

function adicionarCabecalho(doc: PDFKitDocument, dados: DadosCotacao) {
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
    .fontSize(18)
    .fillColor(CORES.PRIMARY_DARK)
    .font('Helvetica-Bold')
    .text('Proposta de Plano de Mídia Digital', 50, 126, { align: 'center' });

  doc
    .fontSize(14)
    .fillColor(CORES.GRAY)
    .font('Helvetica')
    .text(`Cliente: ${dados.clienteNome}`, 50, 154, { align: 'center' });

  doc
    .fontSize(12)
    .text(
      `Período: ${formatarData(dados.dataInicio)} a ${formatarData(dados.dataFim)}`,
      50,
      172,
      { align: 'center' }
    );

  doc.moveDown(1.2);
}

function adicionarResumoExecutivo(
  doc: PDFKitDocument,
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

function adicionarPlanoMidia(doc: PDFKitDocument, dados: DadosCotacao) {
  garantirEspaco(doc, 180);
  doc
    .fontSize(16)
    .fillColor(CORES.PRIMARY_DARK)
    .font('Helvetica-Bold')
    .text('Plano de Mídia', 50, doc.y);

  doc.moveDown(0.5);

  const exibirLeads = deveExibirMetricasLeads(dados.objetivo);
  const startY = doc.y;
  const rowHeight = 30;
  const colDefs = [
    { key: 'canal', label: 'Canal', width: 56, align: 'left' as const },
    { key: 'formato', label: 'Formato', width: 70, align: 'left' as const },
    { key: 'modelo', label: 'Modelo', width: 34, align: 'left' as const },
    { key: 'preco', label: 'Preço', width: 36, align: 'right' as const },
    { key: 'pct', label: '%', width: 24, align: 'right' as const },
    { key: 'budget', label: 'Budget', width: 46, align: 'right' as const },
    { key: 'entrega', label: 'Entrega', width: 58, align: 'left' as const },
    { key: 'imp', label: 'Impr.', width: 38, align: 'right' as const },
    { key: 'ctr', label: 'CTR', width: 24, align: 'right' as const },
    { key: 'cvr', label: 'CVR', width: 24, align: 'right' as const },
    { key: 'cliques', label: 'Cliques', width: 38, align: 'right' as const },
    ...(exibirLeads ? [{ key: 'leads', label: 'Leads', width: 31, align: 'right' as const }] : []),
  ];
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

  let totaisCliques = 0;
  let totaisLeads = 0;
  let totaisImpressoes = 0;
  let currentY = startY + rowHeight;
  dados.mix.forEach((item, index) => {
    if (currentY + rowHeight + 30 > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      currentY = doc.page.margins.top + 10;
    }
    const valorBudget = Number.isFinite(Number(item.valorBudget))
      ? Number(item.valorBudget)
      : (dados.budget * item.percentual) / 100;
    const modeloCompra = item.modeloCompra || obterModeloCompra(item.canal);
    const precoUnitario = Number.isFinite(Number(item.precoUnitario))
      ? Number(item.precoUnitario)
      : obterPrecoUnitarioCanal(item.canal, dados.precos);
    const entregaQuantidade = Number.isFinite(Number(item.entregaEstimada))
      ? Number(item.entregaEstimada)
      : calcularQuantidadeEntrega(modeloCompra, valorBudget, precoUnitario);
    const entregaDescricao = obterDescricaoEntregaPorModelo(modeloCompra);
    const impressoes = calcularImpressoesEstimadas(
      item.canal,
      item.formato || '',
      modeloCompra,
      valorBudget,
      precoUnitario,
      entregaQuantidade
    );
    const cliques = calcularCliquesEstimados(item.canal, modeloCompra, valorBudget, precoUnitario, impressoes);
    const leads = calcularLeadsEstimados(modeloCompra, valorBudget, precoUnitario);
    const ctr = impressoes > 0 && cliques > 0 ? `${((cliques / impressoes) * 100).toFixed(2)}%` : '-';
    const cvr = obterCvrEstimado(item.canal, item.formato || '', modeloCompra);

    totaisImpressoes += impressoes;
    totaisCliques += cliques;
    totaisLeads += leads;

    if (index % 2 === 0) {
      doc.rect(50, currentY, 495, rowHeight).fillColor(CORES.GRAY_LIGHT).fill();
    }
    const rowValues: Record<string, string> = {
      canal: formatarNomeCanal(item.canal),
      formato: item.formato || '-',
      modelo: modeloCompra,
      preco: formatarMoeda(precoUnitario, obterCasasDecimaisPreco(modeloCompra, item.canal)),
      pct: `${item.percentual.toFixed(1)}%`,
      budget: formatarMoeda(valorBudget),
      entrega: `${formatarNumero(entregaQuantidade)} ${entregaDescricao}`,
      imp: impressoes > 0 ? formatarNumero(impressoes) : '-',
      ctr,
      cvr: cvr != null ? `${cvr}%` : '-',
      cliques: cliques > 0 ? formatarNumero(cliques) : '-',
      leads: leads > 0 ? formatarNumero(leads) : '-',
    };

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
  const totalCtr = totaisImpressoes > 0 ? `${((totaisCliques / totaisImpressoes) * 100).toFixed(2)}%` : '-';
  const totalValues: Record<string, string> = {
    canal: 'TOTAIS',
    formato: '',
    modelo: '',
    preco: '',
    pct: '100.0%',
    budget: formatarMoeda(dados.budget),
    entrega: '',
    imp: totaisImpressoes > 0 ? formatarNumero(totaisImpressoes) : '-',
    ctr: totalCtr,
    cvr: '-',
    cliques: totaisCliques > 0 ? formatarNumero(totaisCliques) : '-',
    leads: totaisLeads > 0 ? formatarNumero(totaisLeads) : '-',
  };
  x = 50;
  columns.forEach((col) => {
    doc.text(totalValues[col.key] || '', x + 2, currentY + 8, {
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

  const estimativas = [
    ['Métrica', 'Estimativa'],
    ['Impressões', formatarNumero(dados.estimativas.impressoes)],
    ['Cliques', formatarNumero(dados.estimativas.cliques)],
    ['eCPM', formatarMoeda(dados.estimativas.cpmEstimado)],
    ['eCPC', formatarMoeda(dados.estimativas.cpcEstimado)],
    [
      'Taxa de Clique (eCTR)',
      dados.estimativas.impressoes > 0
        ? `${((dados.estimativas.cliques / dados.estimativas.impressoes) * 100).toFixed(2)}%`
        : '0.00%',
    ],
    ...(deveExibirMetricasLeads(dados.objetivo)
      ? [
          ['Leads', formatarNumero(dados.estimativas.leads)],
          ['CPL', formatarMoeda(dados.estimativas.cplEstimado)],
        ]
      : []),
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

  doc.y = startY + estimativas.length * rowHeight + 12;
}

function deveExibirMetricasLeads(objetivo: string): boolean {
  return objetivo === 'LEADS' || objetivo === 'VENDAS';
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

// Funções auxiliares
function formatarMoeda(valor: number, casasDecimais = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  }).format(valor);
}

function obterCasasDecimaisPreco(modeloCompra: string, canal?: string): number {
  if (modeloCompra === 'CPC') return 2;
  if (modeloCompra === 'CPV' && canal === 'CTV') return 4;
  if (modeloCompra === 'CPV') return 3;
  return 2;
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

function calcularCliquesEstimados(
  canal: string,
  modeloCompra: string,
  valorBudget: number,
  precoUnitario: number,
  impressoes: number
): number {
  if (!Number.isFinite(precoUnitario) || precoUnitario <= 0) return 0;
  if (modeloCompra === 'CPC' || modeloCompra === 'CPE') {
    return Math.round(valorBudget / precoUnitario);
  }
  if (modeloCompra === 'CPM') {
    const ctr = canal === 'SOCIAL_PROGRAMATICO' ? 0.02 : 0.004;
    return Math.round(impressoes * ctr);
  }
  return 0;
}

function calcularLeadsEstimados(
  modeloCompra: string,
  valorBudget: number,
  precoUnitario: number
): number {
  if (!Number.isFinite(precoUnitario) || precoUnitario <= 0) return 0;
  if (modeloCompra === 'CPL' || modeloCompra === 'CPA' || modeloCompra === 'CPI') {
    return Math.round(valorBudget / precoUnitario);
  }
  return 0;
}

function calcularImpressoesEstimadas(
  canal: string,
  formato: string,
  modeloCompra: string,
  valorBudget: number,
  precoUnitario: number,
  entregaEstimada: number
): number {
  if (!Number.isFinite(precoUnitario) || precoUnitario <= 0) return 0;
  if (modeloCompra === 'CPM') {
    return Math.round((valorBudget / precoUnitario) * 1000);
  }
  if (modeloCompra === 'CPC' || modeloCompra === 'CPE') {
    const ctr = canal === 'SOCIAL_PROGRAMATICO' ? 0.02 : 0.004;
    return ctr > 0 ? Math.round(entregaEstimada / ctr) : 0;
  }
  if (modeloCompra === 'CPV') {
    const cvr = obterCvrEstimado(canal, formato, modeloCompra);
    if (!cvr) return 0;
    return Math.round(entregaEstimada / (cvr / 100));
  }
  return 0;
}

function obterCvrEstimado(canal: string, formato: string, modeloCompra: string): number | null {
  if (modeloCompra !== 'CPV') return null;
  if (canal === 'CTV' || formato.toLowerCase().includes('ctv')) return 95;
  if (formato.includes('15')) return 80;
  if (formato.includes('30')) return 75;
  return 75;
}

