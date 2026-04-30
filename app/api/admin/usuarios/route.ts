import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { obterUserIdDoRequest, usuarioTemRole } from '@/lib/utils/auth';
import { mapDbRoleToUi, mapUiRoleToDb, type RoleUI } from '@/lib/utils/roles';

const schemaCriarUsuario = z.object({
  solicitanteId: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() || undefined : undefined),
    z.string().min(1, 'Solicitante inválido').optional()
  ),
  solicitanteEmail: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() || undefined : undefined),
    z.string().email('Email do solicitante inválido').optional()
  ),
  nome: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() || undefined : undefined),
    z.string().min(1, 'Nome é obrigatório').optional()
  ),
  email: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() || undefined : undefined),
    z.string().email('Email inválido').optional()
  ),
  senha: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() : value),
    z.string().min(6, 'Senha mínima de 6 caracteres')
  ),
  role: z.preprocess(
    (value) => (typeof value === 'string' ? value.toUpperCase().trim() : value),
    z.enum(['ADMIN', 'MANAGER', 'COMERCIAL'])
  ),
});

export async function GET(request: NextRequest) {
  try {
    const userId = obterUserIdDoRequest(request.headers);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado.' },
        { status: 401 }
      );
    }
    const isAdmin = await usuarioTemRole(userId, [Role.ADMIN]);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const [usuarios, solicitantes] = await Promise.all([
      prisma.wp_Usuario.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          ativo: true,
          createdAt: true,
        },
      }),
      prisma.wp_Solicitante.findMany({
        where: { ativo: true },
        orderBy: { nome: 'asc' },
        select: {
          id: true,
          nome: true,
          email: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      usuarios: usuarios.map((item) => ({
        ...item,
        role: mapDbRoleToUi(item.role),
      })),
      solicitantes,
      roles: ['ADMIN', 'MANAGER', 'COMERCIAL'] as RoleUI[],
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar usuários' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = obterUserIdDoRequest(request.headers);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado.' },
        { status: 401 }
      );
    }
    const isAdmin = await usuarioTemRole(userId, [Role.ADMIN]);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parseResult = schemaCriarUsuario.safeParse(body);
    if (!parseResult.success) {
      const senhaLen =
        typeof body?.senha === 'string'
          ? body.senha.length
          : body?.senha == null
            ? 0
            : String(body.senha).length;
      console.warn('[admin/usuarios][invalid_payload]', {
        solicitanteId: body?.solicitanteId,
        solicitanteEmail: body?.solicitanteEmail,
        role: body?.role,
        senhaLength: senhaLen,
        issues: parseResult.error.issues,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Dados inválidos',
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }
    const dados = parseResult.data;

    let nome = dados.nome?.trim();
    let email = dados.email?.trim().toLowerCase();

    if (dados.solicitanteId || dados.solicitanteEmail) {
      const solicitante = dados.solicitanteId
        ? await prisma.wp_Solicitante.findUnique({
            where: { id: dados.solicitanteId },
            select: { nome: true, email: true, ativo: true },
          })
        : await prisma.wp_Solicitante.findUnique({
            where: { email: String(dados.solicitanteEmail).toLowerCase() },
            select: { nome: true, email: true, ativo: true },
          });
      if (!solicitante || !solicitante.ativo) {
        return NextResponse.json(
          {
            success: false,
            error: 'Solicitante não encontrado ou inativo.',
          },
          { status: 404 }
        );
      }
      nome = solicitante.nome;
      email = solicitante.email.toLowerCase();
    }

    if (!nome || !email) {
      return NextResponse.json(
        { success: false, error: 'Nome e email são obrigatórios.' },
        { status: 400 }
      );
    }

    const senhaHash = await hashPassword(dados.senha);
    const novoUsuario = await prisma.wp_Usuario.create({
      data: {
        nome,
        email,
        senhaHash,
        role: mapUiRoleToDb(dados.role),
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      usuario: {
        ...novoUsuario,
        role: mapDbRoleToUi(novoUsuario.role),
      },
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Já existe usuário com este e-mail.' },
        { status: 409 }
      );
    }
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}
