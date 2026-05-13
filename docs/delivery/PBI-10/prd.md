# PRD - PBI-10: Hardening de segurança e acesso (auth, domínios, sessão e plataformas)

## Contexto
O produto hoje usa autenticação própria (e-mail/senha, JWT) e está exposto em Vercel, com banco acessível via Prisma. Não há evidência no repositório de cliente Supabase em runtime; mesmo assim a fase de checagem cobre Supabase caso dados ou auth auxiliar existam fora do código.

## Problema
- Login sem OAuth corporativo dificulta SSO e governança de identidade.
- Não há garantia documentada de que apenas colaboradores dos domínios aprovados possam autenticar.
- Sessões longas sem política de inatividade aumentam risco de uso indevido em equipamento compartilhado.
- Configurações de segurança em GitHub, Vercel e eventual Supabase precisam ser auditadas e padronizadas.

## Objetivo
1. Habilitar **login via Google (OAuth)** alinhado ao fluxo Next.js existente, com provisionamento/roles já usados no sistema.
2. **Restringir** criação de sessão e login a e-mails terminando em **`@weachgroup.net`**, **`@insightmedia.com.br`** ou **`@influlab.com.br`** (lista configurável por ambiente).
3. Implementar **logout por inatividade de 1 hora** (sessão/token + UX de aviso quando aplicável).
4. Executar **checklist de segurança** no código, GitHub, Supabase (se aplicável) e Vercel, com registro de achados e tarefas corretivas.

## Fora de escopo (neste PBI, salvo decisão explícita)
- Substituir completamente o modelo de usuários no banco por diretório externo sem migração.
- Certificação formal (SOC2); foco é hardening operacional e boas práticas.

## Critérios de sucesso
- Documento de auditoria preenchido (riscos, severidade, ações).
- Domínios bloqueados/ permitidos testados em staging e produção.
- Política de 1h de inatividade verificável (token expira ou refresh negado após janela).
- OAuth Google funcional para usuários permitidos, com fallback ou desligamento claro do login por senha se for decisão de produto.

## Referências
- OWASP ASVS (autenticação e gestão de sessão).
- Documentação Vercel (Environment Variables, Deployment Protection).
- GitHub (branch protection, secret scanning, Dependabot).
