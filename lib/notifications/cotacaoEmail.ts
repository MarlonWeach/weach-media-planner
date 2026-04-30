import nodemailer from 'nodemailer';

type DefinicaoCampanha = 'PERFORMANCE' | 'PROGRAMATICA' | 'WHATSAPP_SMS_PUSH';

interface RecipientResolutionInput {
  definicaoCampanha: DefinicaoCampanha[];
  solicitanteEmail?: string;
}

interface RecipientResolutionResult {
  shouldSend: boolean;
  required: boolean;
  to: string[];
  cc: string[];
  warnings: string[];
}

interface SendCotacaoEmailInput {
  cotacaoId: string;
  clienteNome: string;
  clienteSegmento: string;
  objetivo: string;
  budget: number;
  regiao: string;
  definicaoCampanha: DefinicaoCampanha[];
  solicitanteNome?: string;
  solicitanteEmail?: string;
  agenciaNome?: string;
  observacoes?: string;
  mix?: Array<{
    canal: string;
    percentual: number;
    formato?: string;
    modeloCompra?: string;
    valorBudget?: number;
    precoUnitario?: number;
    entregaEstimada?: number;
  }>;
  precos?: unknown;
  estimativas?: {
    impressoes?: number;
    cliques?: number;
    leads?: number;
    cpmEstimado?: number;
    cpcEstimado?: number;
    cplEstimado?: number;
  };
  cotacaoProativa?: boolean;
  attachments?: Array<{ path: string; filename: string }>;
  attachmentPath?: string;
  attachmentFilename?: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function parseEmailsFromEnv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeUniqueEmails(emails: string[]): string[] {
  return Array.from(new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean)));
}

function isTruthy(value: string | undefined, defaultValue = false): boolean {
  if (value === undefined) return defaultValue;
  const normalized = value.trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'sim'].includes(normalized);
}

export function resolveCotacaoEmailRecipients(
  input: RecipientResolutionInput
): RecipientResolutionResult {
  const definicoes = input.definicaoCampanha || [];
  const hasPerformance = definicoes.includes('PERFORMANCE');
  const hasProgramaticaOuMensageria =
    definicoes.includes('PROGRAMATICA') || definicoes.includes('WHATSAPP_SMS_PUSH');

  const emailProgramaticaHabilitado = isTruthy(
    process.env.EMAIL_PROGRAMATICA_HABILITADO,
    true
  );
  const shouldSend = hasPerformance || (emailProgramaticaHabilitado && hasProgramaticaOuMensageria);
  const required = hasPerformance;

  const warnings: string[] = [];
  const toBase = parseEmailsFromEnv(process.env.EMAIL_COTACAO_TO);
  const ccBase = parseEmailsFromEnv(process.env.EMAIL_COTACAO_CC);
  const ccPerf = hasPerformance
    ? parseEmailsFromEnv(process.env.EMAIL_COTACAO_CC_PERFORMANCE)
    : [];
  const ccProg = hasProgramaticaOuMensageria
    ? parseEmailsFromEnv(process.env.EMAIL_COTACAO_CC_PROGRAMATICA)
    : [];

  let to = normalizeUniqueEmails(toBase);
  let cc = normalizeUniqueEmails([...ccBase, ...ccPerf, ...ccProg]);

  const includeSolicitante = isTruthy(
    process.env.EMAIL_COTACAO_INCLUDE_SOLICITANTE,
    true
  );
  const solicitante = input.solicitanteEmail?.trim().toLowerCase();
  if (includeSolicitante) {
    if (solicitante && solicitante.includes('@')) {
      cc = normalizeUniqueEmails([...cc, solicitante]);
    } else if (input.solicitanteEmail) {
      warnings.push('Solicitante com e-mail inválido não foi incluído no envio.');
    }
  }

  // Remove qualquer email repetido em TO/CC, priorizando TO
  cc = cc.filter((email) => !to.includes(email));

  if (shouldSend && to.length === 0) {
    warnings.push('EMAIL_COTACAO_TO não configurado.');
  }

  return { shouldSend, required, to, cc, warnings };
}

function buildEmailBody(input: SendCotacaoEmailInput): string {
  const hasPerformance = input.definicaoCampanha.includes('PERFORMANCE');
  const observacoesGerais = extrairObservacoesGerais(input.observacoes);
  const sectionDivider = '\n------------------------------------------------------------\n';
  const header = `Cotação ${input.cotacaoId} - ${input.clienteNome}`;
  const campanha = [
    `Segmento: ${input.clienteSegmento}`,
    `Objetivo: ${input.objetivo}`,
    `Budget: R$ ${input.budget.toLocaleString('pt-BR')}`,
    `Região: ${input.regiao}`,
    `Definição de campanha: ${
      input.definicaoCampanha.length > 0 ? input.definicaoCampanha.join(', ') : 'Não informada'
    }`,
  ].join('\n');

  const solicitante = [
    `Solicitante: ${input.solicitanteNome || 'Não informado'}`,
    `E-mail do solicitante: ${input.solicitanteEmail || 'Não informado'}`,
    `Agência: ${input.agenciaNome || 'Não informada'}`,
  ].join('\n');

  if (hasPerformance) {
    const observacoes = `Observações / contexto:\n${observacoesGerais}`;
    return `${header}${sectionDivider}${campanha}${sectionDivider}${solicitante}${sectionDivider}${observacoes}\n`;
  }

  const linhasPlano = buildPlanoTexto(input);
  return `${header}${sectionDivider}${campanha}${sectionDivider}${solicitante}${sectionDivider}Plano de mídia:\n${linhasPlano}\n`;
}

function buildEmailHtml(input: SendCotacaoEmailInput): string {
  const hasPerformance = input.definicaoCampanha.includes('PERFORMANCE');
  const observacoesGerais = extrairObservacoesGerais(input.observacoes);
  const exibirMetricasLeads = ['LEADS', 'VENDAS'].includes(String(input.objetivo || ''));
  const definicao =
    input.definicaoCampanha.length > 0
      ? input.definicaoCampanha.join(', ')
      : 'Não informada';

  const rows: Array<{ label: string; value: string }> = [
    { label: 'ID da Cotação', value: input.cotacaoId },
    { label: 'Nome do Anunciante / Campanha', value: input.clienteNome },
    { label: 'Segmento', value: input.clienteSegmento },
    { label: 'Objetivo', value: input.objetivo },
    { label: 'Budget', value: `R$ ${input.budget.toLocaleString('pt-BR')}` },
    { label: 'Região', value: input.regiao },
    { label: 'Definição de Campanha', value: definicao },
    { label: 'Cotação é pró-ativa?', value: input.cotacaoProativa ? 'Sim' : 'Não' },
    { label: 'Solicitante', value: input.solicitanteNome || 'Não informado' },
    { label: 'E-mail do Solicitante', value: input.solicitanteEmail || 'Não informado' },
    { label: 'Agência', value: input.agenciaNome || 'Não informada' },
    { label: 'Observações Gerais', value: observacoesGerais },
  ];

  const rowsHtml = rows
    .map(
      (row) => `
        <tr>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;color:#111827;width:280px;">
            ${escapeHtml(row.label)}
          </td>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111827;">
            ${escapeHtml(row.value)}
          </td>
        </tr>
      `
    )
    .join('');

  const briefingHtml = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.5;">
      <h2 style="margin:0 0 8px 0;">Formulário de Cotação - ${escapeHtml(input.clienteNome)}</h2>
      <p style="margin:0 0 16px 0;color:#4b5563;">
        Cotação ${escapeHtml(input.cotacaoId)} enviada para análise comercial.
      </p>
      <table style="border-collapse:collapse;width:100%;max-width:980px;">
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <p style="margin-top:16px;color:#6b7280;font-size:12px;">
        Mensagem gerada automaticamente pelo Weach Media Planner.
      </p>
    </div>
  `;

  if (hasPerformance) {
    return briefingHtml;
  }

  const planoRows = buildPlanoRows(input);
  const estimativas = input.estimativas || {};
  const estimativasLista = [
    ['Impressões', formatNumber(estimativas.impressoes ?? 0)],
    ['Cliques', formatNumber(estimativas.cliques ?? 0)],
    ['CPM estimado', formatCurrency(estimativas.cpmEstimado ?? 0)],
    ['CPC estimado', formatCurrency(estimativas.cpcEstimado ?? 0)],
    ...(exibirMetricasLeads
      ? [
          ['Leads', formatNumber(estimativas.leads ?? 0)],
          ['CPL estimado', formatCurrency(estimativas.cplEstimado ?? 0)],
        ]
      : []),
  ] as Array<[string, string]>;

  const estimativasRows = estimativasLista
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px 10px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;">${escapeHtml(label)}</td>
          <td style="padding:8px 10px;border:1px solid #e5e7eb;">${escapeHtml(value)}</td>
        </tr>
      `
    )
    .join('');

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.5;">
      <h2 style="margin:0 0 8px 0;">Validação de Cotação Programática - ${escapeHtml(input.clienteNome)}</h2>
      <p style="margin:0 0 16px 0;color:#4b5563;">
        Cotação ${escapeHtml(input.cotacaoId)} para validação interna.
      </p>
      <table style="border-collapse:collapse;width:100%;max-width:980px;margin-bottom:12px;">
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <h3 style="margin:14px 0 8px 0;color:#1f2937;">Plano de mídia</h3>
      <table style="border-collapse:collapse;width:100%;max-width:980px;margin-bottom:12px;">
        <thead>
          <tr>
            <th style="padding:8px 10px;border:1px solid #d1d5db;background:#1f2937;color:#fff;text-align:left;">Canal</th>
            <th style="padding:8px 10px;border:1px solid #d1d5db;background:#1f2937;color:#fff;text-align:right;">%</th>
            <th style="padding:8px 10px;border:1px solid #d1d5db;background:#1f2937;color:#fff;text-align:right;">Budget</th>
            <th style="padding:8px 10px;border:1px solid #d1d5db;background:#1f2937;color:#fff;text-align:left;">Modelo</th>
            <th style="padding:8px 10px;border:1px solid #d1d5db;background:#1f2937;color:#fff;text-align:right;">Preço Unit.</th>
            <th style="padding:8px 10px;border:1px solid #d1d5db;background:#1f2937;color:#fff;text-align:left;">Entrega Estimada</th>
          </tr>
        </thead>
        <tbody>
          ${planoRows}
        </tbody>
      </table>
      <h3 style="margin:14px 0 8px 0;color:#1f2937;">Estimativas de resultado</h3>
      <table style="border-collapse:collapse;width:100%;max-width:980px;">
        <tbody>
          ${estimativasRows}
        </tbody>
      </table>
      <p style="margin-top:16px;color:#6b7280;font-size:12px;">
        Mensagem gerada automaticamente pelo Weach Media Planner.
      </p>
    </div>
  `;
}

function extrairObservacoesGerais(observacoes?: string): string {
  if (!observacoes || observacoes.trim() === '') {
    return 'Sem observações.';
  }
  try {
    const payload = JSON.parse(observacoes) as {
      solicitacao?: { observacoesGerais?: string };
    };
    const texto = payload?.solicitacao?.observacoesGerais;
    if (typeof texto === 'string' && texto.trim() !== '') {
      return texto.trim();
    }
    // Se conseguimos parsear JSON mas o campo veio vazio, não retornar payload bruto.
    return 'Sem observações.';
  } catch {
    // Mantém fallback para textos livres
  }
  const textoLivre = observacoes.trim();
  if (textoLivre.startsWith('{') && textoLivre.endsWith('}')) {
    return 'Sem observações.';
  }
  return observacoes;
}

function formatCurrency(value: number, casasDecimais = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  }).format(Number.isFinite(value) ? value : 0);
}

function getCasasDecimaisPreco(modelo: string, canal?: string): number {
  if (modelo === 'CPC') return 2;
  if (modelo === 'CPV' && canal === 'CTV') return 4;
  if (modelo === 'CPV') return 3;
  return 2;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function getModeloCompra(canal: string): string {
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

function getNomeCanal(canal: string): string {
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
  return nomes[canal] || canal.replaceAll('_', ' ');
}

function getPrecoUnitario(canal: string, precos: any): number {
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

function getDescricaoEntrega(modelo: string): string {
  const map: Record<string, string> = {
    CPM: 'impressões',
    CPC: 'cliques',
    CPV: 'complete views',
    CPL: 'leads',
    CPI: 'instalações',
    CPA: 'aquisições',
    CPD: 'disparos',
    CPE: 'engajamentos',
  };
  return map[modelo] || 'entregas';
}

function calcEntrega(modelo: string, budget: number, precoUnit: number): number {
  if (!Number.isFinite(precoUnit) || precoUnit <= 0) return 0;
  if (modelo === 'CPM') return Math.round((budget / precoUnit) * 1000);
  return Math.round(budget / precoUnit);
}

function buildPlanoRows(input: SendCotacaoEmailInput): string {
  const mix = input.mix || [];
  const precos = input.precos as any;
  return mix
    .map((item) => {
      const percentual = Number(item.percentual || 0);
      const budgetLinha = Number.isFinite(Number(item.valorBudget))
        ? Number(item.valorBudget)
        : (input.budget * percentual) / 100;
      const modelo = item.modeloCompra || getModeloCompra(item.canal);
      const precoUnit = Number.isFinite(Number(item.precoUnitario))
        ? Number(item.precoUnitario)
        : getPrecoUnitario(item.canal, precos);
      const entrega = Number.isFinite(Number(item.entregaEstimada))
        ? Number(item.entregaEstimada)
        : calcEntrega(modelo, budgetLinha, precoUnit);
      const canalLabel = item.formato
        ? `${getNomeCanal(item.canal)} - ${item.formato}`
        : getNomeCanal(item.canal);
      return `
        <tr>
          <td style="padding:8px 10px;border:1px solid #e5e7eb;">${escapeHtml(canalLabel)}</td>
          <td style="padding:8px 10px;border:1px solid #e5e7eb;text-align:right;">${escapeHtml(percentual.toFixed(1))}%</td>
          <td style="padding:8px 10px;border:1px solid #e5e7eb;text-align:right;">${escapeHtml(formatCurrency(budgetLinha))}</td>
          <td style="padding:8px 10px;border:1px solid #e5e7eb;">${escapeHtml(modelo)}</td>
          <td style="padding:8px 10px;border:1px solid #e5e7eb;text-align:right;">${escapeHtml(formatCurrency(precoUnit, getCasasDecimaisPreco(modelo, item.canal)))}</td>
          <td style="padding:8px 10px;border:1px solid #e5e7eb;">${escapeHtml(`${formatNumber(entrega)} ${getDescricaoEntrega(modelo)}`)}</td>
        </tr>
      `;
    })
    .join('');
}

function buildPlanoTexto(input: SendCotacaoEmailInput): string {
  const mix = input.mix || [];
  const precos = input.precos as any;
  if (mix.length === 0) return '- Sem linhas de plano disponíveis.';
  return mix
    .map((item) => {
      const percentual = Number(item.percentual || 0);
      const budgetLinha = Number.isFinite(Number(item.valorBudget))
        ? Number(item.valorBudget)
        : (input.budget * percentual) / 100;
      const modelo = item.modeloCompra || getModeloCompra(item.canal);
      const precoUnit = Number.isFinite(Number(item.precoUnitario))
        ? Number(item.precoUnitario)
        : getPrecoUnitario(item.canal, precos);
      const entrega = Number.isFinite(Number(item.entregaEstimada))
        ? Number(item.entregaEstimada)
        : calcEntrega(modelo, budgetLinha, precoUnit);
      const canalLabel = item.formato
        ? `${getNomeCanal(item.canal)} - ${item.formato}`
        : getNomeCanal(item.canal);
      return `- ${canalLabel} | ${percentual.toFixed(1)}% | ${formatCurrency(budgetLinha)} | ${modelo} ${formatCurrency(precoUnit, getCasasDecimaisPreco(modelo, item.canal))} | ${formatNumber(entrega)} ${getDescricaoEntrega(modelo)}`;
    })
    .join('\n');
}

export async function sendCotacaoOperationalEmail(
  input: SendCotacaoEmailInput,
  recipients: { to: string[]; cc: string[] }
): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_COTACAO_FROM || process.env.SMTP_FROM || user;

  if (!host || !port || !user || !pass || !from) {
    throw new Error(
      'Configuração SMTP incompleta. Defina SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS e EMAIL_COTACAO_FROM/SMTP_FROM.'
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const tipo =
    input.definicaoCampanha.includes('PERFORMANCE') && input.definicaoCampanha.includes('PROGRAMATICA')
      ? 'HÍBRIDA'
      : input.definicaoCampanha.join(' + ') || 'COTAÇÃO';

  await transporter.sendMail({
    from,
    to: recipients.to.join(', '),
    cc: recipients.cc.length > 0 ? recipients.cc.join(', ') : undefined,
    subject: `[Cotação ${tipo}] ${input.clienteNome} (${input.cotacaoId})`,
    text: buildEmailBody(input),
    html: buildEmailHtml(input),
    attachments:
      input.attachments && input.attachments.length > 0
        ? input.attachments.map((item) => ({ filename: item.filename, path: item.path }))
        : input.attachmentPath && input.attachmentFilename
          ? [{ filename: input.attachmentFilename, path: input.attachmentPath }]
          : undefined,
  });
}
