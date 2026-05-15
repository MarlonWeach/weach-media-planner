/**
 * Teste rápido de append no Google Sheets (usa .env local).
 * Uso: node scripts/test-google-sheets-append.mjs
 */
import { readFileSync } from 'fs';
import { google } from 'googleapis';

function loadEnv() {
  const raw = readFileSync('.env', 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}

loadEnv();

const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const key = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
const tabName = process.env.GOOGLE_SHEETS_TAB_NAME || 'Form Responses 1';

const auth = new google.auth.JWT({
  email,
  key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

try {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const titles = meta.data.sheets?.map((s) => s.properties?.title) ?? [];
  console.log('Planilha OK. Abas:', titles.join(' | '));

  const testRow = new Array(37).fill('');
  testRow[0] = new Date().toISOString();
  testRow[4] = 'TESTE-SCRIPT';
  testRow[36] = '2026-TEST';

  const existentes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabName}!A:AK`,
  });
  const proximaLinha = (existentes.data.values?.length ?? 0) + 1;

  const res = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tabName}!A${proximaLinha}:AK${proximaLinha}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [testRow] },
  });
  console.log('Gravação OK:', res.data.updatedRange);
} catch (e) {
  console.error('Falha:', e?.response?.data?.error || e.message);
  process.exit(1);
}
