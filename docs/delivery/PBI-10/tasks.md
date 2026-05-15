# Tasks - PBI-10: Hardening de segurança e acesso

## Status Geral
✅ Done _(tasks 10-1 a 10-8 fechadas; checklists em `auditorias-seguranca.md`)_

## Tasks

| ID | Descrição | Status | Prioridade |
|----|-----------|--------|------------|
| 10-1 | Login via **Google (OAuth 2.0)** integrado ao app (Next.js): fluxo de callback, vínculo com `wp_Usuario` existente ou provisionamento controlado | ✅ Done | ⚠️ Alta |
| 10-2 | **Allowlist de domínios** no login (e convites, se houver): apenas `@weachgroup.net`, `@insightmedia.com.br`, `@influlab.com.br` — validação no servidor e mensagem clara na UI | ✅ Done | 🚨 Crítica |
| 10-3 | **Logout por inatividade 1h**: expiração de JWT/refresh, timer no cliente (`AuthContext`), opcional aviso antes de expirar; alinhar com `POST /api/auth/login` e `me` | ✅ Done | ⚠️ Alta |
| 10-4 | **Auditoria GitHub**: branch protection em `main`, secret scanning, Dependabot, revisão de collaborators e PATs; documentar no fechamento da task | ✅ Done | ⚠️ Alta |
| 10-5 | **Auditoria Supabase** (se projeto ou dados usarem): RLS, chaves `anon`/`service_role`, políticas de auth, backups; se não aplicável, registrar **N/A** com justificativa | ✅ Done | 📌 Média |
| 10-6 | **Auditoria Vercel**: variáveis de ambiente (sem segredo em preview público), Deployment Protection, domínios, headers de segurança (`next.config`/middleware) | ✅ Done | ⚠️ Alta |
| 10-7 | **Auditoria aplicação**: rate limit em login, força de senha, headers (`CSP`, `HSTS` onde couber), CORS, revisão de rotas admin sem auth, logs sem dados sensíveis | ✅ Done | ⚠️ Alta |
| 10-8 | **Primeira senha pós-Google:** flag `senhaLocalConfigurada` + `change-password` + UI Ajustes (ver `PBI-10-8.md`) | ✅ Done | 📌 Média |

## Ordem recomendada
1. `10-2` allowlist (rápido e alto impacto em conjunto com login actual).
2. `10-3` inatividade 1h (reduz janela de risco).
3. `10-1` OAuth Google (depende de decisão de produto e console Google Cloud).
4. `10-4` a `10-7` auditorias em paralelo (checklist + issues no backlog se achados grandes).
5. `10-8` concluída: primeira senha para contas só OAuth (`PBI-10-8.md`).

## Observações
- **Índice de todos os guias e checklists:** [`indice-documentos-pbi-10.md`](./indice-documentos-pbi-10.md).
- **GitHub (10-4):** [`guia-github-10-4.md`](./guia-github-10-4.md) — checklist fechada em [`auditorias-seguranca.md`](./auditorias-seguranca.md) (2026-05-12).
- **Supabase (10-5):** [`guia-supabase-10-5.md`](./guia-supabase-10-5.md) — checklist fechada em [`auditorias-seguranca.md`](./auditorias-seguranca.md) (2026-05-15).
- **Vercel (10-6):** [`guia-vercel-10-6.md`](./guia-vercel-10-6.md) — checklist fechada em [`auditorias-seguranca.md`](./auditorias-seguranca.md) (2026-05-15).
- **Aplicação (10-7):** [`guia-aplicacao-10-7.md`](./guia-aplicacao-10-7.md) — checklist fechada em [`auditorias-seguranca.md`](./auditorias-seguranca.md) (2026-05-15).
- **Google OAuth (10-1):** definir `GOOGLE_OAUTH_CLIENT_ID` e `GOOGLE_OAUTH_CLIENT_SECRET` no ambiente; no Google Cloud Console, autorizar o redirect URI `https://<seu-dominio>/api/auth/google/callback` (e o equivalente em `http://localhost:3000` para desenvolvimento). Opcional: `GOOGLE_OAUTH_AUTO_PROVISION=false` para exigir utilizador pré-criado no banco (sem auto-registo COMERCIAL). Após deploy, correr migração / `db push` para o campo `googleSub` em `wp_Usuario` e para **`senhaLocalConfigurada`** (task 10-8). Se o login falhar com `redirect_uri` / troca de token, definir **`GOOGLE_OAUTH_REDIRECT_URI`** com o mesmo URI exacto registado no Google (ex.: `http://localhost:3000/api/auth/google/callback`) para evitar divergência `localhost` vs `127.0.0.1` ou proxies.
- Domínios devem ser configuráveis por variável de ambiente (ex.: `AUTH_EMAIL_DOMAIN_ALLOWLIST`) para testes locais com exceção controlada.
- Confirmar grafia do domínio **influlab.com.br** (conforme solicitado).
- O repositório usa **Postgres** (Prisma); o host pode ser **Supabase** — ver guia e checklist **10-5**.
