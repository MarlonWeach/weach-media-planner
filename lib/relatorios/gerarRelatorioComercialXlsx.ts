import ExcelJS from 'exceljs';
import type { RelatorioComercialPayload } from '@/lib/relatorios/types';

const FILL_CABECALHO = {
  type: 'pattern' as const,
  pattern: 'solid' as const,
  fgColor: { argb: 'FF17375E' },
};

const FONTE_CABECALHO = {
  name: 'Calibri',
  size: 11,
  bold: true,
  color: { argb: 'FFFFFFFF' },
};

function adicionarTabela(
  ws: ExcelJS.Worksheet,
  titulo: string,
  cabecalhos: string[],
  linhas: (string | number)[][]
) {
  const tituloRow = ws.rowCount + 1;
  ws.getCell(tituloRow, 1).value = titulo;
  ws.getCell(tituloRow, 1).font = { name: 'Calibri', size: 12, bold: true };

  const headerRow = tituloRow + 1;
  cabecalhos.forEach((h, i) => {
    const cell = ws.getCell(headerRow, i + 1);
    cell.value = h;
    cell.fill = FILL_CABECALHO;
    cell.font = FONTE_CABECALHO;
  });

  linhas.forEach((cols, idx) => {
    const row = headerRow + 1 + idx;
    cols.forEach((val, colIdx) => {
      ws.getCell(row, colIdx + 1).value = val;
    });
  });

  ws.addRow([]);
}

export async function gerarBufferRelatorioComercialXlsx(
  payload: RelatorioComercialPayload
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Weach Media Planner';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Relatório', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  ws.getColumn(1).width = 28;
  ws.getColumn(2).width = 16;
  ws.getColumn(3).width = 18;
  ws.getColumn(4).width = 14;

  ws.getCell(1, 1).value = 'Relatório comercial Weach Media Planner';
  ws.getCell(1, 1).font = { name: 'Calibri', size: 14, bold: true };
  ws.getCell(2, 1).value = `Gerado em: ${new Date(payload.geradoEm).toLocaleString('pt-BR')}`;
  const periodo =
    payload.filtros.dataInicio && payload.filtros.dataFim
      ? `${payload.filtros.dataInicio} a ${payload.filtros.dataFim}`
      : 'Período não informado';
  ws.getCell(3, 1).value = `Período: ${periodo}`;
  ws.addRow([]);

  adicionarTabela(ws, 'Resumo', ['Indicador', 'Valor'], [
    ['Total de cotações', payload.resumo.totalCotacoes],
    ['Budget total', payload.resumo.budgetTotal],
    ['Ticket médio', Math.round(payload.resumo.ticketMedio * 100) / 100],
  ]);

  adicionarTabela(
    ws,
    'Por comercial',
    ['Comercial', 'Cotações', 'Budget'],
    payload.porComercial.map((c) => [c.nome, c.quantidade, c.budget])
  );

  adicionarTabela(
    ws,
    'Por período',
    ['Período', 'Cotações', 'Budget'],
    payload.porPeriodo.map((p) => [p.label, p.quantidade, p.budget])
  );

  adicionarTabela(
    ws,
    'Por segmento',
    ['Segmento', 'Cotações', 'Budget', '% quantidade'],
    payload.porSegmento.map((s) => [
      s.label,
      s.quantidade,
      s.budget,
      Math.round(s.percentualQuantidade * 10) / 10,
    ])
  );

  adicionarTabela(
    ws,
    'Por objetivo',
    ['Objetivo', 'Cotações', 'Budget'],
    payload.porObjetivo.map((o) => [o.label, o.quantidade, o.budget])
  );

  adicionarTabela(
    ws,
    'Mix médio por canal',
    ['Canal', '% médio', 'Ocorrências'],
    payload.mixMedioPorCanal.map((m) => [
      m.label,
      Math.round(m.percentualMedio * 10) / 10,
      m.ocorrencias,
    ])
  );

  if (payload.desviosPrecoPerformance.length > 0) {
    adicionarTabela(
      ws,
      'Desvios de preço (performance)',
      ['Cotação', 'Cliente', 'Formato', 'Tabela', 'Final', 'Desvio %'],
      payload.desviosPrecoPerformance.map((d) => [
        d.cotacaoId,
        d.clienteNome,
        d.formato,
        d.precoTabela,
        d.precoFinal,
        d.desvioPercent,
      ])
    );
  }

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}
