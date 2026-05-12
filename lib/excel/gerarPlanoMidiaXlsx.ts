import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import type { DadosCotacao } from '@/lib/cotacao/planoMidiaTabelaComercial';
import {
  construirMatrizEstimativas,
  faseCampanhaPorObjetivo,
  formatarData,
  formatarNumero,
  formatarObjetivo,
  formatarSegmento,
  montarLinhasMetricasPlanoMidia,
  textoKpiPrincipalCotacao,
  textoResumoExecutivo,
} from '@/lib/cotacao/planoMidiaTabelaComercial';

const MIDIA_FIXA = 'Weach Programmatic';

/** Metadados da proposta no modelo da planilha legada (K3–K9, período etc.). */
export interface MetadadosPropostaXlsx {
  dataCotacao: Date;
  agenciaNome: string;
  regiaoTexto: string;
}

const FILL_CABECALHO = {
  type: 'pattern' as const,
  pattern: 'solid' as const,
  fgColor: { argb: 'FF17375E' },
};

const FILL_RESUMO_FUNDO = {
  type: 'pattern' as const,
  pattern: 'solid' as const,
  fgColor: { argb: 'FFF2F2F2' },
};

const FILL_KPI_TITULO = {
  type: 'pattern' as const,
  pattern: 'solid' as const,
  fgColor: { argb: 'FFEBF1DE' },
};

const FILL_LINHA_TABELA = {
  type: 'pattern' as const,
  pattern: 'solid' as const,
  fgColor: { argb: 'FFF2F2F2' },
};

const BORDA_FINA = {
  top: { style: 'thin' as const, color: { argb: 'FFD1D5DB' } },
  left: { style: 'thin' as const, color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin' as const, color: { argb: 'FFD1D5DB' } },
  right: { style: 'thin' as const, color: { argb: 'FFD1D5DB' } },
};

/** Altura padrão da linha (pontos, alinhado ao “15” do Excel). */
const ALTURA_LINHA_PADRAO = 15;

const TEXTO_OBSERVACOES_PROPOSTA = [
  'OBSERVAÇÕES DA PROPOSTA:',
  '- Os valores considerados na proposta são para impressão da campanha nos canais digitais contemplados na proposta sem contemplar custo de produção.',
  '- O Material deverá ser fornecido pelo cliente/agência em formato solicitado nas especificações da Weach.',
  '- A Weach se reserva no direito de não aceitar conteúdos impróprios ou que contenham mensagens de violência, ou que violem a legislação brasileira, ou ainda no caso de infringir as suas políticas comerciais.',
  '- Proposta válida por 30 dias da data de sua emissão.',
].join('\n');

const FONTE_BRANCA = { name: 'Calibri', size: 10, color: { argb: 'FFFFFFFF' } };
const FONTE_BRANCA_NEGRITO = {
  name: 'Calibri',
  size: 10,
  bold: true,
  color: { argb: 'FFFFFFFF' },
};

/** Larguras colunas B–T (sem Usuários únicos nem Leads). */
const LARGURAS_COLS_B_T = [
  16.83203125, 16.83203125, 16.83203125, 11.5, 13.33203125, 21.1640625, 19, 14.6640625, 14.6640625,
  14.6640625, 14.6640625, 14.6640625, 14.1640625, 14.6640625, 11.5, 14.83203125, 10.83203125, 28, 42.5,
];

function diasCorridosPeriodo(inicio: Date, fim: Date): number {
  const ms = fim.getTime() - inicio.getTime();
  return Math.max(1, Math.ceil(ms / 86400000) + 1);
}

function textoSegmentacaoResumo(dados: DadosCotacao, regiaoTexto: string): string {
  const seg = formatarSegmento(dados.clienteSegmento);
  const reg = (regiaoTexto || dados.regiao || '').trim();
  if (!reg) return seg;
  return `${seg} · ${reg}`;
}

function preencherRangeAzulBranco(
  ws: ExcelJS.Worksheet,
  rowStart: number,
  rowEnd: number,
  colStart: number,
  colEnd: number
) {
  for (let r = rowStart; r <= rowEnd; r += 1) {
    for (let c = colStart; c <= colEnd; c += 1) {
      const cell = ws.getCell(r, c);
      cell.fill = FILL_CABECALHO;
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FFFFFFFF' } };
    }
  }
}

function definirParResumoHK(
  ws: ExcelJS.Worksheet,
  row: number,
  label: string,
  valor: string | number | Date
) {
  const cH = ws.getCell(row, 8);
  const cK = ws.getCell(row, 11);
  cH.value = label;
  cH.font = FONTE_BRANCA_NEGRITO;
  cH.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  cK.value = valor;
  cK.font = FONTE_BRANCA;
  cK.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
}

function aplicarEstiloU4(ws: ExcelJS.Worksheet, row: number) {
  ws.mergeCells(`U${row}:V${row}`);
  const c = ws.getCell(`U${row}`);
  c.font = { name: 'Calibri', size: 10 };
  c.fill = FILL_RESUMO_FUNDO;
  c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
}

function caminhoLogoWeach(): string | null {
  const candidatos = [
    path.join(process.cwd(), 'public', 'branding', 'weach-negative.png'),
    path.join(process.cwd(), 'public', 'weach-negative.png'),
  ];
  for (const p of candidatos) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export async function gerarBufferPlanoMidiaXlsx(
  dados: DadosCotacao,
  meta: MetadadosPropostaXlsx
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Weach Media Planner';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Cenario 1', {
    views: [{ showGridLines: false }],
    properties: { defaultRowHeight: ALTURA_LINHA_PADRAO },
  });

  LARGURAS_COLS_B_T.forEach((w, i) => {
    ws.getColumn(i + 2).width = w;
  });

  ws.getRow(2).height = ALTURA_LINHA_PADRAO;

  preencherRangeAzulBranco(ws, 3, 9, 2, 10);

  definirParResumoHK(ws, 3, 'DATA', formatarData(meta.dataCotacao));
  definirParResumoHK(ws, 4, 'AGÊNCIA', meta.agenciaNome || '—');
  definirParResumoHK(ws, 5, 'CAMPANHA', dados.clienteNome);
  definirParResumoHK(ws, 6, 'DATA DE INÍCIO', formatarData(dados.dataInicio));
  definirParResumoHK(ws, 7, 'DATA DE TÉRMINO', formatarData(dados.dataFim));
  definirParResumoHK(ws, 8, 'OBJETIVO', formatarObjetivo(dados.objetivo));
  definirParResumoHK(ws, 9, 'KPI PRINCIPAL', textoKpiPrincipalCotacao(dados));

  ws.mergeCells('R3:V3');
  const titResumo = ws.getCell('R3');
  titResumo.value = 'RESUMO DA PROPOSTA';
  titResumo.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  titResumo.fill = FILL_CABECALHO;
  titResumo.alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells('R4:T4');
  ws.getCell('R4').value = 'PERÍODO';
  ws.getCell('R4').font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getCell('R4').fill = FILL_CABECALHO;
  ws.getCell('R4').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.mergeCells('U4:V4');
  ws.getCell('U4').value = `${diasCorridosPeriodo(dados.dataInicio, dados.dataFim)} dias corridos`;
  ws.getCell('U4').font = { name: 'Calibri', size: 10 };
  ws.getCell('U4').fill = FILL_RESUMO_FUNDO;
  ws.getCell('U4').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  preencherRangeAzulBranco(ws, 5, 8, 18, 20);
  for (let rr = 5; rr <= 8; rr += 1) {
    aplicarEstiloU4(ws, rr);
  }

  ws.mergeCells('R9:T9');
  ws.getCell('R9').value = 'INVESTIMENTO';
  ws.getCell('R9').font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getCell('R9').fill = FILL_CABECALHO;
  ws.getCell('R9').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.mergeCells('U9:V9');
  ws.getCell('U9').value = Number(dados.budget);
  ws.getCell('U9').numFmt = '"R$" #,##0.00';
  ws.getCell('U9').font = { name: 'Calibri', size: 10, bold: true };
  ws.getCell('U9').fill = FILL_RESUMO_FUNDO;
  ws.getCell('U9').alignment = { horizontal: 'center', vertical: 'middle' };

  const r12 = 12;
  ws.mergeCells(`B${r12}:D${r12}`);
  ws.getCell(`B${r12}`).value = 'ESTRATÉGIA PROPOSTA';
  ws.mergeCells(`E${r12}:H${r12}`);
  ws.getCell(`E${r12}`).value = 'TÁTICA PROPOSTA';
  ws.mergeCells(`I${r12}:P${r12}`);
  ws.getCell(`I${r12}`).value = 'KPIS MÍDIA';
  ws.mergeCells(`Q${r12}:T${r12}`);
  ws.getCell(`Q${r12}`).value = 'Observações';

  for (const addr of [`B${r12}`, `E${r12}`, `I${r12}`]) {
    const c = ws.getCell(addr);
    c.font = { name: 'Calibri', size: 10, bold: true };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.fill = addr === `I${r12}` ? FILL_KPI_TITULO : FILL_RESUMO_FUNDO;
    c.border = {
      left: { style: 'medium' },
      top: { style: 'medium' },
      bottom: { style: 'dotted', color: { argb: 'FFFFFFFF' } },
    };
  }
  const cObsTit = ws.getCell(`Q${r12}`);
  cObsTit.font = { name: 'Calibri', size: 10, bold: true };
  cObsTit.alignment = { horizontal: 'center', vertical: 'middle' };
  cObsTit.fill = FILL_RESUMO_FUNDO;
  cObsTit.border = {
    left: { style: 'medium' },
    right: { style: 'medium' },
    top: { style: 'medium' },
  };

  const headers = [
    'CAMPANHA',
    'MÍDIA',
    'FASE',
    'CANAIS',
    'COBRANÇA',
    'SEGMENTAÇÃO/ DADOS',
    'FORMATOS',
    'INVENTARIO',
    'ALCANCE',
    'ENTREGA',
    'IMP.',
    'CTR',
    'CVR',
    'CLIQUES',
    'INVESTIMENTO LÍQUIDO',
  ];
  const row13 = ws.getRow(13);
  headers.forEach((label, i) => {
    const col = 2 + i;
    const cell = row13.getCell(col);
    cell.value = label;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = FILL_CABECALHO;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = BORDA_FINA;
  });
  ws.mergeCells('Q13:T13');
  const obsH = ws.getCell('Q13');
  obsH.value = 'Observações';
  obsH.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  obsH.fill = FILL_CABECALHO;
  obsH.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  obsH.border = BORDA_FINA;

  const segmentacao = textoSegmentacaoResumo(dados, meta.regiaoTexto);
  const fase = faseCampanhaPorObjetivo(dados.objetivo);
  const linhasMetricas = montarLinhasMetricasPlanoMidia(dados);

  let rowIdx = 14;
  linhasMetricas.forEach((m, index) => {
    const r = ws.getRow(rowIdx);
    const zebra = index % 2 === 0;
    const valores: (string | number)[] = [
      dados.clienteNome,
      MIDIA_FIXA,
      fase,
      m.canal,
      m.modeloCompra,
      segmentacao,
      m.formato,
      '',
      '',
      `${formatarNumero(m.entregaQuantidade)} ${m.entregaDescricao}`,
      m.impressoes > 0 ? m.impressoes : '—',
      m.ctrRatio != null ? `${(m.ctrRatio * 100).toFixed(2)}%` : '—',
      m.cvrPercent != null ? `${m.cvrPercent}%` : '—',
      m.cliques > 0 ? m.cliques : '—',
      Number(m.valorBudget),
    ];
    valores.forEach((val, i) => {
      const cell = r.getCell(2 + i);
      cell.value = val;
      cell.font = { name: 'Calibri', size: 10 };
      if (i === valores.length - 1) {
        cell.numFmt = '"R$" #,##0.00';
      } else if (typeof val === 'number' && i === 10) {
        cell.numFmt = '#,##0';
      } else if (typeof val === 'number' && i === 13) {
        cell.numFmt = '#,##0';
      }
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.border = BORDA_FINA;
      if (zebra) cell.fill = FILL_LINHA_TABELA;
    });
    rowIdx += 1;
  });

  const rTot = ws.getRow(rowIdx);
  rTot.getCell(2).value = 'TOTAIS';
  rTot.getCell(2).font = { bold: true };
  const somaImp = linhasMetricas.reduce((a, m) => a + m.impressoes, 0);
  const somaCliq = linhasMetricas.reduce((a, m) => a + m.cliques, 0);
  rTot.getCell(12).value = somaImp > 0 ? somaImp : '—';
  if (typeof rTot.getCell(12).value === 'number') {
    rTot.getCell(12).numFmt = '#,##0';
  }
  rTot.getCell(13).value =
    somaImp > 0 && somaCliq > 0 ? `${((somaCliq / somaImp) * 100).toFixed(2)}%` : '—';
  rTot.getCell(14).value = '—';
  rTot.getCell(15).value = somaCliq > 0 ? somaCliq : '—';
  if (typeof rTot.getCell(15).value === 'number') {
    rTot.getCell(15).numFmt = '#,##0';
  }
  rTot.getCell(16).value = Number(dados.budget);
  rTot.getCell(16).numFmt = '"R$" #,##0.00';
  rTot.getCell(16).font = { bold: true };
  for (let col = 2; col <= 16; col += 1) {
    rTot.getCell(col).border = BORDA_FINA;
  }
  rowIdx += 1;

  let rFoot = rowIdx + 2;
  ws.getCell(rFoot, 2).value = 'Resumo';
  ws.getCell(rFoot, 2).font = { name: 'Calibri', size: 10, bold: true };
  ws.mergeCells(rFoot, 3, rFoot, 10);
  const cRes = ws.getCell(rFoot, 3);
  cRes.value = textoResumoExecutivo(dados);
  cRes.font = { name: 'Calibri', size: 10 };
  cRes.alignment = { vertical: 'top', wrapText: true, horizontal: 'left' };
  rFoot += 1;

  ws.mergeCells(`B${rFoot}:J${rFoot}`);
  const sub = ws.getCell(`B${rFoot}`);
  sub.value = 'Estimativas consolidadas';
  sub.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  sub.fill = FILL_CABECALHO;
  sub.alignment = { vertical: 'middle', horizontal: 'left' };
  rFoot += 1;

  for (const [metrica, estimativa] of construirMatrizEstimativas(dados).slice(1)) {
    ws.getCell(rFoot, 2).value = metrica;
    ws.getCell(rFoot, 2).font = { name: 'Calibri', size: 10, bold: true };
    ws.getCell(rFoot, 3).value = estimativa;
    ws.getCell(rFoot, 3).font = { name: 'Calibri', size: 10 };
    ws.getCell(rFoot, 3).alignment = { vertical: 'middle', wrapText: true };
    rFoot += 1;
  }

  rFoot += 1;
  ws.mergeCells(rFoot, 2, rFoot, 20);
  const cObs = ws.getCell(rFoot, 2);
  cObs.value = TEXTO_OBSERVACOES_PROPOSTA;
  cObs.font = { name: 'Calibri', size: 10 };
  cObs.alignment = { vertical: 'top', wrapText: true, horizontal: 'left' };
  ws.getRow(rFoot).height = 120;
  rFoot += 1;

  const logoPath = caminhoLogoWeach();
  if (logoPath) {
    const imageId = workbook.addImage({
      filename: logoPath,
      extension: 'png',
    });
    ws.addImage(imageId, 'B2:E10');
  }

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}
