/**
 * GET /api/auth/google/status — indica se o botão “Continuar com Google” pode ser mostrado.
 */

import { NextResponse } from 'next/server';
import { googleOAuthEstaConfigurado } from '@/lib/auth/googleOAuth';

export async function GET() {
  return NextResponse.json({
    success: true,
    enabled: googleOAuthEstaConfigurado(),
  });
}
