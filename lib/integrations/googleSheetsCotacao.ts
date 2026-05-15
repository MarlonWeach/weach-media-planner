import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

interface SyncCotacaoInput {
  id: string;
  numeroSequencial?: number | null;
  createdAt?: Date;
  dataInicio?: Date | null;
  dataFim?: Date | null;
  clienteNome: string;
  clienteSegmento: string;
  urlLp?: string;
  budget: number;
  solicitanteNome?: string | null;
  solicitanteEmail?: string | null;
  agenciaNome?: string | null;
  observacoes?: string | null;
}

type JsonRecord = Record<string, unknown>;
const MAX_RETRY_ATTEMPTS = 3;

function getEnv(name: string): string {
  return String(process.env[name] || '').trim();
}

function normalizePrivateKey(value: string): string {
  return value.replace(/\\n/g, '\n');
}

function isSheetsSyncEnabled(): boolean {
  const raw = getEnv('GOOGLE_SHEETS_SYNC_ENABLED').toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'sim';
}

function parseObservacoesAsObject(observacoes?: string | null): JsonRecord {
  if (!observacoes) return {};
  try {
    const parsed = JSON.parse(observacoes);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as JsonRecord;
    }
    return {};
  } catch {
    return {};
  }
}

function toCellValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(toCellValue).filter(Boolean).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function formatDateBr(value?: Date | null): string {
  if (!value) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(value);
}

function getString(obj: unknown, path: string[]): string {
  let current: unknown = obj;
  for (const key of path) {
    if (!current || typeof current !== 'object') return '';
    current = (current as JsonRecord)[key];
  }
  if (current === null || current === undefined) return '';
  return String(current).trim();
}

function getBoolean(obj: unknown, path: string[]): boolean | undefined {
  let current: unknown = obj;
  for (const key of path) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as JsonRecord)[key];
  }
  if (typeof current === 'boolean') return current;
  return undefined;
}

function getArray(obj: unknown, path: string[]): string[] {
  let current: unknown = obj;
  for (const key of path) {
    if (!current || typeof current !== 'object') return [];
    current = (current as JsonRecord)[key];
  }
  if (!Array.isArray(current)) return [];
  return current.map((value) => String(value).trim()).filter(Boolean);
}

function buildLegacyRow(input: SyncCotacaoInput): string[] {
  const payload = parseObservacoesAsObject(input.observacoes);
  const definicaoCampanha = getArray(payload, ['estrategia', 'definicaoCampanha']);
  const modelosPerformance = getArray(payload, ['estrategia', 'performance', 'modelos']);
  const modelosProgramatica = getArray(payload, ['estrategia', 'programatica', 'modelos']);
  const servicosMensageria = getArray(payload, ['estrategia', 'servicosMensageria']);
  const tipoRegiao = getString(payload, ['cobertura', 'tipoRegiao']).toUpperCase();
  const observacoesGerais = getString(payload, ['solicitacao', 'observacoesGerais']);
  const periodStart = formatDateBr(input.dataInicio);
  const periodEnd = formatDateBr(input.dataFim);

  // Layout legado: A..AE e AK (AF..AJ ficam vazias)
  const row = new Array<string>(37).fill('');
  row[0] = input.createdAt ? input.createdAt.toISOString() : new Date().toISOString(); // A Timestamp
  row[1] = input.solicitanteNome ?? ''; // B
  row[2] = input.solicitanteEmail ?? ''; // C
  row[3] = getString(payload, ['solicitacao', 'dataSolicitacao']) || (input.createdAt ? formatDateBr(input.createdAt) : ''); // D
  row[4] = getString(payload, ['solicitacao', 'anuncianteCampanha']) || input.clienteNome; // E
  row[5] = input.agenciaNome ?? ''; // F
  row[6] = getString(payload, ['solicitacao', 'urlLp']) || input.urlLp || ''; // G
  row[7] = input.clienteSegmento; // H
  row[8] = periodStart && periodEnd ? `${periodStart} a ${periodEnd}` : ''; // I
  row[9] = tipoRegiao && tipoRegiao !== 'NACIONAL' ? 'Sim' : 'Não'; // J
  row[10] = getBoolean(payload, ['solicitacao', 'cotacaoProativa']) ? 'Sim' : 'Não'; // K
  row[11] = definicaoCampanha.join(', '); // L
  row[12] = modelosPerformance.join(', '); // M (performance)
  row[13] = toCellValue(input.budget); // N unificado
  row[14] = getString(payload, ['estrategia', 'performance', 'cplCamposCadastro']); // O
  row[15] = getString(payload, ['estrategia', 'performance', 'cplQualFiltro']); // P
  row[16] = getString(payload, ['estrategia', 'performance', 'cplConversaoLeadCompleta']); // Q
  const outrasRedes = getString(payload, ['estrategia', 'performance', 'veiculaOutrasRedes']);
  const quaisRedes = getString(payload, ['estrategia', 'performance', 'veiculaQuaisRedes']);
  row[17] = [outrasRedes, quaisRedes].filter(Boolean).join(' - '); // R
  row[18] = getString(payload, ['estrategia', 'performance', 'clienteValorSugerido']); // S
  row[19] = observacoesGerais; // T (unificado)
  row[20] = modelosProgramatica.join(', '); // U (programática)
  row[21] = getString(payload, ['estrategia', 'programatica', 'formatosPretendidos']); // V (texto livre)
  row[22] = getString(payload, ['estrategia', 'programatica', 'segmentacaoExigida']); // W
  row[23] = ''; // X descontinuado
  row[24] = getString(payload, ['estrategia', 'programatica', 'kpiObjetivo']); // Y
  row[25] = getString(payload, ['solicitacao', 'anexoDriveLink']); // Z anexo único por link
  row[26] = servicosMensageria.join(', '); // AA
  row[27] = ''; // AB descontinuado (unificado em T)
  row[28] = ''; // AC descontinuado (unificado em N)
  row[29] = ''; // AD descontinuado (unificado em T)
  row[30] = ''; // AE descontinuado (unificado em Z)
  row[36] = input.numeroSequencial ? String(input.numeroSequencial) : ''; // AK

  return row;
}

export async function syncCotacaoToGoogleSheets(input: SyncCotacaoInput): Promise<void> {
  if (!isSheetsSyncEnabled()) return;

  const serviceAccountEmail = getEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const serviceAccountPrivateKey = normalizePrivateKey(getEnv('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY'));
  const spreadsheetId = getEnv('GOOGLE_SHEETS_ID');
  const tabName = getEnv('GOOGLE_SHEETS_TAB_NAME') || 'Cotacoes';

  if (!serviceAccountEmail || !serviceAccountPrivateKey || !spreadsheetId) {
    throw new Error(
      'Configuração Google Sheets incompleta. Defina GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY e GOOGLE_SHEETS_ID.'
    );
  }

  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: serviceAccountPrivateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const row = buildLegacyRow(input);
  const cotacaoId = input.id;
  const numeroSequencialLabel = input.numeroSequencial ? String(input.numeroSequencial) : '';

  const logExistente = await prisma.wp_IntegracaoSheetsLog.findUnique({
    where: { cotacaoId },
    select: { status: true, tentativas: true },
  });
  if (logExistente?.status === 'SUCESSO') {
    return;
  }

  await prisma.wp_IntegracaoSheetsLog.upsert({
    where: { cotacaoId },
    create: {
      cotacaoId,
      status: 'EM_PROCESSAMENTO',
      tentativas: 1,
      sheetName: tabName,
    },
    update: {
      status: 'EM_PROCESSAMENTO',
      tentativas: { increment: 1 },
      sheetName: tabName,
      ultimoErro: null,
    },
  });

  let ultimoErro = '';
  for (let tentativa = 1; tentativa <= MAX_RETRY_ATTEMPTS; tentativa += 1) {
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${tabName}!A:AK`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [row],
        },
      });

      await prisma.wp_IntegracaoSheetsLog.update({
        where: { cotacaoId },
        data: {
          status: 'SUCESSO',
          ultimoErro: null,
          ultimoSyncAt: new Date(),
          linhasEnviadas: 1,
          ultimaReferencia: numeroSequencialLabel,
        },
      });
      return;
    } catch (error) {
      ultimoErro = error instanceof Error ? error.message : String(error);
    }
  }

  await prisma.wp_IntegracaoSheetsLog.update({
    where: { cotacaoId },
    data: {
      status: 'ERRO',
      ultimoErro,
      ultimaReferencia: numeroSequencialLabel,
    },
  });

  throw new Error(
    `Falha ao sincronizar cotação ${numeroSequencialLabel || cotacaoId} no Google Sheets após ${MAX_RETRY_ATTEMPTS} tentativas: ${ultimoErro}`
  );
}

