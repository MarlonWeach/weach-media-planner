import nodemailer from 'nodemailer';
import { montarLinhasBriefingObservacoes, type BriefingLinha } from '@/lib/cotacao/briefingLinhas';
import { modeloCompraCrmPorFormato, precoUnitarioCrmPorFormato } from '@/lib/cotacao/precosMensageriaCrm';

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

interface InternalRecipientResolutionResult {
  to: string[];
  cc: string[];
  warnings: string[];
}

interface FinalDecisionRecipientResolutionResult {
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

function htmlCelulaValorBriefing(label: string, valor: string): string {
  const v = valor.trim();
  if (
    label === 'Link do anexo (Drive)' &&
    (v.startsWith('http://') || v.startsWith('https://'))
  ) {
    return `<a href="${escapeHtml(v)}" style="color:#2563eb;word-break:break-all;">${escapeHtml(v)}</a>`;
  }
  return escapeHtml(valor);
}

function briefingLinhasParaHtmlTabela(linhas: BriefingLinha[]): string {
  return linhas
    .map(
      (row) => `
        <tr>
          <td style="padding:8px 10px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;width:280px;vertical-align:top;">${escapeHtml(row.label)}</td>
          <td style="padding:8px 10px;border:1px solid #e5e7eb;vertical-align:top;">${htmlCelulaValorBriefing(row.label, row.value)}</td>
        </tr>
      `
    )
    .join('');
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

export function resolveCotacaoInternalRecipients(input?: {
  solicitanteEmail?: string;
}): InternalRecipientResolutionResult {
  const warnings: string[] = [];
  const toBase = parseEmailsFromEnv(process.env.EMAIL_COTACAO_TO);
  const ccBase = parseEmailsFromEnv(process.env.EMAIL_COTACAO_CC);
  const ccPerf = parseEmailsFromEnv(process.env.EMAIL_COTACAO_CC_PERFORMANCE);
  const ccProg = parseEmailsFromEnv(process.env.EMAIL_COTACAO_CC_PROGRAMATICA);

  const to = normalizeUniqueEmails(toBase);
  let cc = normalizeUniqueEmails([...ccBase, ...ccPerf, ...ccProg]).filter(
    (email) => !to.includes(email)
  );

  const includeSolicitante = isTruthy(
    process.env.EMAIL_COTACAO_INCLUDE_SOLICITANTE,
    true
  );
  const solicitante = input?.solicitanteEmail?.trim().toLowerCase();
  if (includeSolicitante) {
    if (solicitante && solicitante.includes('@')) {
      cc = normalizeUniqueEmails([...cc, solicitante]).filter((email) => !to.includes(email));
    } else if (input?.solicitanteEmail) {
      warnings.push('Solicitante com e-mail inválido não foi incluído no envio.');
    }
  }

  if (to.length === 0) {
    warnings.push('EMAIL_COTACAO_TO não configurado para notificação interna.');
  }

  return { to, cc, warnings };
}

export function resolveCotacaoFinalDecisionRecipients(input: {
  solicitanteEmail?: string;
  definicaoCampanha: DefinicaoCampanha[];
}): FinalDecisionRecipientResolutionResult {
  const warnings: string[] = [];
  const solicitante = (input.solicitanteEmail || '').trim().toLowerCase();
  const to = solicitante && solicitante.includes('@') ? [solicitante] : [];

  if (to.length === 0) {
    warnings.push('Solicitante sem e-mail válido para envio final.');
  }

  const hasPerformance = input.definicaoCampanha.includes('PERFORMANCE');
  const hasProgramaticaOuMensageria =
    input.definicaoCampanha.includes('PROGRAMATICA') ||
    input.definicaoCampanha.includes('WHATSAPP_SMS_PUSH');

  const ccBase = parseEmailsFromEnv(process.env.EMAIL_COTACAO_CC);
  const ccPerf = hasPerformance
    ? parseEmailsFromEnv(process.env.EMAIL_COTACAO_CC_PERFORMANCE)
    : [];
  const ccProg = hasProgramaticaOuMensageria
    ? parseEmailsFromEnv(process.env.EMAIL_COTACAO_CC_PROGRAMATICA)
    : [];

  const cc = normalizeUniqueEmails([...ccBase, ...ccPerf, ...ccProg]).filter(
    (email) => !to.includes(email)
  );

  return { to, cc, warnings };
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

  const espelhoLinhas = montarLinhasBriefingObservacoes(input.observacoes);
  const espelhoTexto = [
    'Espelho completo do formulário (todas as perguntas e respostas):',
    ...espelhoLinhas.map((row) => `  ${row.label}: ${row.value}`),
  ].join('\n');

  if (hasPerformance) {
    const observacoes = `Observações / contexto:\n${observacoesGerais}`;
    return `${header}${sectionDivider}${campanha}${sectionDivider}${solicitante}${sectionDivider}${observacoes}${sectionDivider}${espelhoTexto}\n`;
  }

  const linhasPlano = buildPlanoTexto(input);
  return `${header}${sectionDivider}${campanha}${sectionDivider}${solicitante}${sectionDivider}${espelhoTexto}${sectionDivider}Plano de mídia:\n${linhasPlano}\n`;
}

function buildEmailHtml(input: SendCotacaoEmailInput): string {
  const hasPerformance = input.definicaoCampanha.includes('PERFORMANCE');
  const observacoesGerais = extrairObservacoesGerais(input.observacoes);
  const exibirMetricasLeads = ['LEADS', 'VENDAS'].includes(String(input.objetivo || ''));
  const definicao =
    input.definicaoCampanha.length > 0
      ? input.definicaoCampanha.join(', ')
      : 'Não informada';

  const espelhoLinhas = montarLinhasBriefingObservacoes(input.observacoes);
  const resumoLinhas: BriefingLinha[] = [
    { label: 'ID da Cotação', value: input.cotacaoId },
    { label: 'Nome do Anunciante / Campanha', value: input.clienteNome },
    { label: 'Segmento', value: input.clienteSegmento },
    { label: 'Objetivo (cadastro)', value: input.objetivo || '(Em branco)' },
    { label: 'Budget', value: `R$ ${input.budget.toLocaleString('pt-BR')}` },
    { label: 'Região', value: input.regiao },
    { label: 'Definição de Campanha', value: definicao },
    { label: 'Cotação é pró-ativa?', value: input.cotacaoProativa ? 'Sim' : 'Não' },
    { label: 'Solicitante', value: input.solicitanteNome || 'Não informado' },
    { label: 'E-mail do Solicitante', value: input.solicitanteEmail || 'Não informado' },
    { label: 'Agência', value: input.agenciaNome || 'Não informada' },
    { label: 'Observações Gerais (texto livre legado)', value: observacoesGerais },
  ];

  const todasLinhasResumoEspelho = [...resumoLinhas, ...espelhoLinhas];
  const rowsHtml = briefingLinhasParaHtmlTabela(todasLinhasResumoEspelho);

  const briefingHtml = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.5;">
      <h2 style="margin:0 0 8px 0;">Formulário de Cotação - ${escapeHtml(input.clienteNome)}</h2>
      <p style="margin:0 0 16px 0;color:#4b5563;">
        Cotação ${escapeHtml(input.cotacaoId)} enviada para análise comercial. A tabela abaixo inclui o resumo operacional e o espelho completo do formulário (programática, performance, cobertura, anexo e demais campos; respostas vazias aparecem como (Em branco)).
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

function extrairResumoPrecoFinal(observacoes?: string): string | null {
  if (!observacoes) return null;
  try {
    const payload = JSON.parse(observacoes) as {
      historicoPerformance?: {
        registros?: Array<{ precoFinalAplicado?: number; formato?: string; modeloCompra?: string }>;
      };
    };
    const registros = Array.isArray(payload?.historicoPerformance?.registros)
      ? payload.historicoPerformance!.registros!
      : [];
    const validos = registros
      .map((item) => ({
        modelo: String(item.modeloCompra || '').trim().toUpperCase(),
        preco: Number(item.precoFinalAplicado),
      }))
      .filter((item) => Number.isFinite(item.preco) && item.preco > 0);
    if (validos.length === 0) return null;
    if (validos.length === 1) {
      return `${validos[0].modelo || 'PRECO'} ${formatCurrency(validos[0].preco)}`;
    }
    const modelos = Array.from(new Set(validos.map((item) => item.modelo).filter(Boolean)));
    if (modelos.length === 1) {
      return `${modelos[0]} (${validos.length} formatos)`;
    }
    return `${validos.length} formatos com preço final definido`;
  } catch {
    return null;
  }
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

function getModeloCompra(canal: string, formato?: string): string {
  if (canal === 'CRM_MEDIA') {
    return modeloCompraCrmPorFormato(formato);
  }
  const modelos: Record<string, string> = {
    DISPLAY_PROGRAMATICO: 'CPM',
    VIDEO_PROGRAMATICO: 'CPV',
    CTV: 'CPV',
    AUDIO_DIGITAL: 'CPM',
    SOCIAL_PROGRAMATICO: 'CPC',
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

function getPrecoUnitario(canal: string, precos: any, formato?: string): number {
  const crm = precos?.crm as Partial<Record<'whatsappCpd' | 'smsCpd' | 'pushCpc', number>> | undefined;
  if (canal === 'DISPLAY_PROGRAMATICO') return Number(precos?.display?.cpmBase ?? 4);
  if (canal === 'VIDEO_PROGRAMATICO') return Number(precos?.video?.cpvVideo30 ?? 0.04);
  if (canal === 'CTV') return Number(precos?.ctv?.cpvCtv30Open ?? 0.04);
  if (canal === 'AUDIO_DIGITAL') return Number(precos?.audio?.spotifyAudioCpm ?? 47);
  if (canal === 'SOCIAL_PROGRAMATICO') return Number(precos?.social?.fbTrafego ?? 2.5);
  if (canal === 'CRM_MEDIA') {
    const f = (formato || '').toLowerCase();
    if (f.includes('whatsapp')) return Number(crm?.whatsappCpd ?? precoUnitarioCrmPorFormato(formato));
    if (f.includes('sms')) return Number(crm?.smsCpd ?? precoUnitarioCrmPorFormato(formato));
    if (f.includes('push')) return Number(crm?.pushCpc ?? precoUnitarioCrmPorFormato(formato));
    return precoUnitarioCrmPorFormato(formato);
  }
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
      const modelo = item.modeloCompra || getModeloCompra(item.canal, item.formato);
      const precoUnit = Number.isFinite(Number(item.precoUnitario))
        ? Number(item.precoUnitario)
        : getPrecoUnitario(item.canal, precos, item.formato);
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
      const modelo = item.modeloCompra || getModeloCompra(item.canal, item.formato);
      const precoUnit = Number.isFinite(Number(item.precoUnitario))
        ? Number(item.precoUnitario)
        : getPrecoUnitario(item.canal, precos, item.formato);
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

function buildPlanoRowsSomenteProgramatico(input: SendCotacaoEmailInput): string {
  const mixFiltrado = (input.mix || []).filter((item) => item.canal !== 'CPL_CPI');
  return buildPlanoRows({ ...input, mix: mixFiltrado });
}

function buildPlanoTextoSomenteProgramatico(input: SendCotacaoEmailInput): string {
  const mixFiltrado = (input.mix || []).filter((item) => item.canal !== 'CPL_CPI');
  return buildPlanoTexto({ ...input, mix: mixFiltrado });
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

export async function sendPerformanceQueueNotificationEmail(
  input: SendCotacaoEmailInput,
  recipients: { to: string[]; cc: string[] }
): Promise<{ messageId?: string }> {
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

  const briefingLinhas = montarLinhasBriefingObservacoes(input.observacoes);
  const temProgramaticaOuMensageria =
    input.definicaoCampanha.includes('PROGRAMATICA') ||
    input.definicaoCampanha.includes('WHATSAPP_SMS_PUSH');
  const ehHibridoPerformanceMidia =
    input.definicaoCampanha.includes('PERFORMANCE') && temProgramaticaOuMensageria;
  const assunto = ehHibridoPerformanceMidia
    ? `Cotação híbrida (performance + mídia) - ${input.clienteNome} (${input.cotacaoId})`
    : `Cotação - ${input.clienteNome} (${input.cotacaoId})`;
  const corpoTexto = [
    ehHibridoPerformanceMidia
      ? 'Nova cotação HÍBRIDA (performance + programática/mensageria): a parte de performance entrou na fila interna; a parte tabulada segue abaixo e nos anexos (quando gerados).'
      : 'Nova cotação de PERFORMANCE entrou na fila interna para decisão.',
    '',
    `ID: ${input.cotacaoId}`,
    `Cliente: ${input.clienteNome}`,
    `Segmento: ${input.clienteSegmento}`,
    `Objetivo: ${input.objetivo}`,
    `Budget: R$ ${input.budget.toLocaleString('pt-BR')}`,
    `Região: ${input.regiao}`,
    `Solicitante: ${input.solicitanteNome || 'Não informado'} (${input.solicitanteEmail || 'Não informado'})`,
    '',
    'Briefing preenchido:',
    ...briefingLinhas.map((row) => `- ${row.label}: ${row.value}`),
    ...(ehHibridoPerformanceMidia
      ? [
          '',
          'Plano programático / mensageria (tabulado na ferramenta — sem linhas CPL/CPI de performance):',
          buildPlanoTextoSomenteProgramatico(input),
        ]
      : []),
    '',
    `Link interno: ${process.env.NEXT_PUBLIC_APP_URL || ''}/admin/performance-fila/${input.cotacaoId}`,
    '',
    'A decisão final deve ser registrada no sistema.',
  ].join('\n');

  const secaoPlanoHibridoHtml = ehHibridoPerformanceMidia
    ? `
      <div style="margin:16px 0;padding:12px 14px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;">
        <p style="margin:0 0 8px 0;color:#374151;font-size:14px;">
          <strong>Performance (ex.: CPL/CPI):</strong> o plano nesse modelo depende de respostas e da validação interna;
          ele não aparece como tabela fechada neste e-mail.
        </p>
        <p style="margin:0;color:#374151;font-size:14px;">
          <strong>Programática / mensageria:</strong> abaixo, o plano já dimensionado na ferramenta (sem linhas CPL/CPI de performance).
        </p>
      </div>
      <h3 style="margin:14px 0 8px 0;color:#1f2937;">Plano de mídia — programática / mensageria</h3>
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
          ${buildPlanoRowsSomenteProgramatico(input)}
        </tbody>
      </table>
    `
    : '';

  const corpoHtml = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.5;">
      <h2 style="margin:0 0 8px 0;">${ehHibridoPerformanceMidia ? 'Nova cotação híbrida na fila (performance + mídia)' : 'Nova cotação de performance na fila'}</h2>
      <p style="margin:0 0 12px 0;color:#4b5563;">
        A cotação <strong>${escapeHtml(input.cotacaoId)}</strong> entrou em <strong>AGUARDANDO_APROVACAO</strong>.
        ${ehHibridoPerformanceMidia ? ' Há também veiculação programática ou mensageria com plano tabulado.' : ''}
      </p>
      <table style="border-collapse:collapse;width:100%;max-width:900px;">
        <tbody>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;">Cliente</td><td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(input.clienteNome)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;">Segmento</td><td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(input.clienteSegmento)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;">Objetivo</td><td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(input.objetivo)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;">Budget</td><td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(`R$ ${input.budget.toLocaleString('pt-BR')}`)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;">Região</td><td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(input.regiao)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;">Solicitante</td><td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(input.solicitanteNome || 'Não informado')} (${escapeHtml(input.solicitanteEmail || 'Não informado')})</td></tr>
        </tbody>
      </table>
      <h3 style="margin:14px 0 8px 0;color:#1f2937;">Briefing preenchido (espelho completo)</h3>
      <table style="border-collapse:collapse;width:100%;max-width:980px;">
        <tbody>
          ${briefingLinhasParaHtmlTabela(briefingLinhas)}
        </tbody>
      </table>
      ${secaoPlanoHibridoHtml}
      <p style="margin-top:14px;">
        <a href="${escapeHtml(`${process.env.NEXT_PUBLIC_APP_URL || ''}/admin/performance-fila/${input.cotacaoId}`)}">Abrir decisão no sistema</a>
      </p>
    </div>
  `;

  const info = await transporter.sendMail({
    from,
    to: recipients.to.join(', '),
    cc: recipients.cc.length > 0 ? recipients.cc.join(', ') : undefined,
    subject: assunto,
    text: corpoTexto,
    html: corpoHtml,
    attachments:
      input.attachments && input.attachments.length > 0
        ? input.attachments.map((item) => ({ filename: item.filename, path: item.path }))
        : undefined,
  });
  return { messageId: info.messageId };
}

export async function sendPerformanceFinalDecisionEmail(
  input: SendCotacaoEmailInput & {
    decisaoStatus: 'APROVADA' | 'RECUSADA';
    decisaoComentario?: string;
    replyToMessageId?: string;
  },
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

  const statusLabel = input.decisaoStatus === 'APROVADA' ? 'Aprovada' : 'Recusada';
  const comentario = (input.decisaoComentario || '').trim();
  const precoFinalResumo = extrairResumoPrecoFinal(input.observacoes) || 'Conforme validação interna';
  const assunto = `Cotação - ${input.clienteNome} (${input.cotacaoId})`;
  const divider = '------------------------------------------------------------';
  const briefingLinhas = montarLinhasBriefingObservacoes(input.observacoes);
  const corpoTexto = [
    `Olá, tudo bem?`,
    '',
    `Status: ${statusLabel}`,
    `Preço final: ${precoFinalResumo}`,
    ...(comentario ? [`Observação: ${comentario}`] : []),
    '',
    divider,
    'Briefing preenchido:',
    `Cliente: ${input.clienteNome}`,
    `Agência: ${input.agenciaNome || 'Não informada'}`,
    ...briefingLinhas.map((row) => `${row.label}: ${row.value}`),
    '',
    'Atenciosamente,',
    'Equipe Weach',
  ]
    .filter(Boolean)
    .join('\n');

  const corpoHtml = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.5;">
      <h2 style="margin:0 0 10px 0;">Resposta Cotação - ${escapeHtml(input.clienteNome)}</h2>
      <p style="margin:0 0 12px 0;color:#4b5563;">
        ID <strong>${escapeHtml(input.cotacaoId)}</strong> | Status <strong>${escapeHtml(statusLabel)}</strong>
      </p>
      <table style="border-collapse:collapse;width:100%;max-width:900px;">
        <tbody>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;">Preço final</td><td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(precoFinalResumo)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;">Cliente</td><td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(input.clienteNome)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;">Agência</td><td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(input.agenciaNome || 'Não informada')}</td></tr>
          ${
            comentario
              ? `<tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;">Observação</td><td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(
                  comentario
                )}</td></tr>`
              : ''
          }
        </tbody>
      </table>
      <hr style="margin:16px 0;border:none;border-top:1px solid #e5e7eb;" />
      <h3 style="margin:0 0 8px 0;">Espelho completo do formulário</h3>
      <table style="border-collapse:collapse;width:100%;max-width:980px;">
        <tbody>
          ${briefingLinhasParaHtmlTabela(briefingLinhas)}
        </tbody>
      </table>
    </div>
  `;

  await transporter.sendMail({
    from,
    to: recipients.to.join(', '),
    cc: recipients.cc.length > 0 ? recipients.cc.join(', ') : undefined,
    subject: assunto,
    inReplyTo: input.replyToMessageId || undefined,
    references: input.replyToMessageId || undefined,
    text: corpoTexto,
    html: corpoHtml,
    attachments:
      input.attachments && input.attachments.length > 0
        ? input.attachments.map((item) => ({ filename: item.filename, path: item.path }))
        : undefined,
  });
}
