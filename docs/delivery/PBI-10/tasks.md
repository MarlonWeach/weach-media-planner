# Tasks - PBI-10: Hardening de segurança e acesso

## Status Geral
📌 Proposed

## Tasks

| ID | Descrição | Status | Prioridade |
|----|-----------|--------|------------|
| 10-1 | Login via **Google (OAuth 2.0)** integrado ao app (Next.js): fluxo de callback, vínculo com `wp_Usuario` existente ou provisionamento controlado | 📌 Proposed | ⚠️ Alta |
| 10-2 | **Allowlist de domínios** no login (e convites, se houver): apenas `@weachgroup.net`, `@insightmedia.com.br`, `@influlab.com.br` — validação no servidor e mensagem clara na UI | 📌 Proposed | 🚨 Crítica |
| 10-3 | **Logout por inatividade 1h**: expiração de JWT/refresh, timer no cliente (`AuthContext`), opcional aviso antes de expirar; alinhar com `POST /api/auth/login` e `me` | 📌 Proposed | ⚠️ Alta |
| 10-4 | **Auditoria GitHub**: branch protection em `main`, secret scanning, Dependabot, revisão de collaborators e PATs; documentar no fechamento da task | 📌 Proposed | ⚠️ Alta |
| 10-5 | **Auditoria Supabase** (se projeto ou dados usarem): RLS, chaves `anon`/`service_role`, políticas de auth, backups; se não aplicável, registrar **N/A** com justificativa | 📌 Proposed | 📌 Média |
| 10-6 | **Auditoria Vercel**: variáveis de ambiente (sem segredo em preview público), Deployment Protection, domínios, headers de segurança (`next.config`/middleware) | 📌 Proposed | ⚠️ Alta |
| 10-7 | **Auditoria aplicação**: rate limit em login, força de senha, headers (`CSP`, `HSTS` onde couber), CORS, revisão de rotas admin sem auth, logs sem dados sensíveis | 📌 Proposed | ⚠️ Alta |

## Ordem recomendada
1. `10-2` allowlist (rápido e alto impacto em conjunto com login atual).
2. `10-3` inatividade 1h (reduz janela de risco).
3. `10-1` OAuth Google (depende de decisão de produto e console Google Cloud).
4. `10-4` a `10-7` auditorias em paralelo (checklist + issues no backlog se achados grandes).

## Observações
- Domínios devem ser configuráveis por variável de ambiente (ex.: `AUTH_EMAIL_DOMAIN_ALLOWLIST`) para testes locais com exceção controlada.
- Confirmar grafia do domínio **influlab.com.br** (conforme solicitado).
- O repositório atual **não referencia Supabase** no código; a task 10-5 cobre uso externo ou integrações futuras.
