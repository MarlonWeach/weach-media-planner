import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { obterUserIdDoRequest } from '@/lib/utils/auth';

const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;

function getEnv(name: string): string {
  return String(process.env[name] || '').trim();
}

function normalizePrivateKey(value: string): string {
  return value.replace(/\\n/g, '\n');
}

function isPublicLinkEnabled(): boolean {
  const raw = getEnv('GOOGLE_DRIVE_PUBLIC_LINK_ENABLED').toLowerCase();
  if (!raw) return true;
  return ['1', 'true', 'yes', 'sim'].includes(raw);
}

export async function POST(request: NextRequest) {
  try {
    const userId = obterUserIdDoRequest(request.headers);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado.' }, { status: 401 });
    }

    const serviceAccountEmail = getEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const serviceAccountPrivateKey = normalizePrivateKey(getEnv('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY'));
    const driveFolderId = getEnv('GOOGLE_DRIVE_FOLDER_ID');

    if (!serviceAccountEmail || !serviceAccountPrivateKey || !driveFolderId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Configuração Google Drive incompleta. Defina GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY e GOOGLE_DRIVE_FOLDER_ID.',
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Arquivo não enviado.' },
        { status: 400 }
      );
    }
    if (file.size <= 0) {
      return NextResponse.json(
        { success: false, error: 'Arquivo vazio.' },
        { status: 400 }
      );
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Arquivo excede o limite de 20MB.' },
        { status: 400 }
      );
    }

    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: serviceAccountPrivateKey,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const uploadName = `${timestamp}-${file.name}`;
    const created = await drive.files.create({
      requestBody: {
        name: uploadName,
        parents: [driveFolderId],
        mimeType: file.type || 'application/octet-stream',
      },
      media: {
        mimeType: file.type || 'application/octet-stream',
        body: Readable.from(fileBuffer),
      },
      fields: 'id,webViewLink,webContentLink',
      supportsAllDrives: true,
    });

    const fileId = created.data.id;
    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'Não foi possível obter ID do arquivo no Drive.' },
        { status: 500 }
      );
    }

    if (isPublicLinkEnabled()) {
      await drive.permissions.create({
        fileId,
        requestBody: {
          type: 'anyone',
          role: 'reader',
        },
        supportsAllDrives: true,
      });
    }

    const metadata = await drive.files.get({
      fileId,
      fields: 'id,webViewLink,webContentLink',
      supportsAllDrives: true,
    });
    const url =
      metadata.data.webViewLink ||
      metadata.data.webContentLink ||
      `https://drive.google.com/file/d/${fileId}/view`;

    return NextResponse.json({
      success: true,
      fileId,
      url,
    });
  } catch (error) {
    console.error('[DriveUpload][erro]', error);
    const message = error instanceof Error ? error.message : String(error);
    const normalized = message.toLowerCase();

    if (
      normalized.includes('drive api has not been used') ||
      normalized.includes('access not configured') ||
      normalized.includes('permission_denied')
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Google Drive API não está habilitada (ou sem permissão) no projeto da Service Account. Ative a API do Drive no Google Cloud e aguarde alguns minutos.',
        },
        { status: 403 }
      );
    }

    if (
      normalized.includes('service accounts do not have storage quota') ||
      normalized.includes('storage quota')
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'A Service Account não pode gravar em "Meu Drive" por limite de quota. Use uma pasta dentro de Shared Drive corporativo e configure GOOGLE_DRIVE_FOLDER_ID para essa pasta.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao enviar arquivo para o Google Drive.' },
      { status: 500 }
    );
  }
}

