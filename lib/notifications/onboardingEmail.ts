import nodemailer from 'nodemailer';

export async function sendSolicitanteOnboardingEmail(input: {
  to: string;
  nome: string;
  token: string;
}) {
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const link = `${appUrl}/definir-senha?token=${encodeURIComponent(input.token)}`;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to: input.to,
    subject: 'Cadastro no sistema de cotações Weach - Defina sua senha',
    text: [
      `Olá, ${input.nome}.`,
      '',
      'Você foi cadastrado no sistema de cotações da Weach.',
      'Para acessar, defina sua senha no link abaixo:',
      link,
      '',
      'Se você não reconhece este cadastro, desconsidere este e-mail.',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.5;">
        <h2 style="margin:0 0 10px 0;">Bem-vindo ao sistema de cotações Weach</h2>
        <p>Olá, <strong>${input.nome}</strong>.</p>
        <p>Você foi cadastrado no sistema. Para concluir o acesso, clique no botão abaixo para criar sua senha.</p>
        <p style="margin:18px 0;">
          <a href="${link}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:8px;">Definir senha</a>
        </p>
        <p style="font-size:12px;color:#6b7280;">Se o botão não funcionar, copie e cole este link no navegador:</p>
        <p style="font-size:12px;color:#374151;word-break:break-all;">${link}</p>
      </div>
    `,
  });
}

