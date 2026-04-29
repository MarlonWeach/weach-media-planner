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

  const observacoes = `Observações / contexto:\n${input.observacoes || 'Sem observações.'}`;

  return `${header}${sectionDivider}${campanha}${sectionDivider}${solicitante}${sectionDivider}${observacoes}\n`;
}

function buildEmailHtml(input: SendCotacaoEmailInput): string {
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
    { label: 'Solicitante', value: input.solicitanteNome || 'Não informado' },
    { label: 'E-mail do Solicitante', value: input.solicitanteEmail || 'Não informado' },
    { label: 'Agência', value: input.agenciaNome || 'Não informada' },
    { label: 'Observações Gerais', value: input.observacoes || 'Sem observações.' },
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

  return `
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
  });
}
