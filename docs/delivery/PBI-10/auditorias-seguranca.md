# PBI-10 — Auditorias de segurança (10-4 a 10-7)

**Índice de guias e tarefas:** [`indice-documentos-pbi-10.md`](./indice-documentos-pbi-10.md)

**Última actualização do ficheiro:** 2026-05-15  
**Responsável pela validação manual (GitHub / Vercel / org):** Equipa do projecto — **10-4** (2026-05-12), **10-5** (2026-05-15), **10-6** (2026-05-15), **10-7** (2026-05-15) — checklists fechadas.

Instruções: percorrer cada secção; marcar `[x]` quando confirmado; registar datas e notas na coluna ou em “Achados”.

---

## 10-4 — GitHub (repositório e organização)

**Guia passo a passo (PT):** [`guia-github-10-4.md`](./guia-github-10-4.md)

| # | Item | OK | Notas / evidência |
|---|------|----|-------------------|
| 1 | **Branch protection** em `main`: exige PR antes de merge | [x] | Confirmado |
| 2 | **Reviews** obrigatórios (mínimo 1 aprovador, conforme política) | [x] | Confirmado |
| 3 | **Status checks** obrigatórios (CI) antes do merge | [x] | Workflow `CI` (`.github/workflows/ci.yml`) + regra no `main` |
| 4 | **Secret scanning** habilitado (GitHub Advanced Security ou regras org) | [x] | Confirmado / ou N/A plano (registado na org) |
| 5 | **Dependabot** ou equivalente (updates de dependências) | [x] | Confirmado |
| 6 | **Dependabot alerts** revistos e triados (críticos tratados) | [x] | Ronda de triagem concluída |
| 7 | **Collaborators** externos: lista mínima e justificada | [x] | Revisto |
| 8 | **PATs / deploy keys**: inventário; revogar o que estiver obsoleto | [x] | Revisto |
| 9 | **2FA** obrigatório para membros com write (política org) | [x] | Confirmado na org ou política interna alinhada |

**Validação 10-4:** checklist considerada **fechada** em 2026-05-12, conforme pedido de validação completa.

**Achados (código / repo):** não aplicável; itens acima são só no painel GitHub.

---

## 10-5 — Supabase

**Guia passo a passo (PT):** [`guia-supabase-10-5.md`](./guia-supabase-10-5.md)

| # | Item | OK | Notas |
|---|------|----|--------|
| 1 | Confirmar se **algum ambiente** (prod/stage) usa Supabase para dados ou auth desta app | [x] | Postgres hospedado no Supabase; app via Prisma (`DATABASE_URL`). |

**Conclusão:** projecto Supabase como **host Postgres**; sem `createClient` no repo. Advisor WARN (`rls_auto_enable`) e INFO (RLS sem políticas) tratados com SQL em `docs/delivery/PBI-10/sql/`.

| # | Item (se Supabase existir) | OK | Notas |
|---|------|----|--------|
| 1 | **RLS** em tabelas expostas ao `anon` | [x] | Políticas `pbi10_block_anon_authenticated` + revoke RPC |
| 2 | Chave **`service_role`** só em servidor; nunca em `NEXT_PUBLIC_*` nem browser | [x] | N/A na app; não exposto em `NEXT_PUBLIC_*` |
| 3 | Políticas de **Auth** e redirects alinhados ao produto | [x] | Auth da app é Next/JWT; URL config Supabase para uso futuro / consistência |
| 4 | **Backups** / PITR conforme RTO acordado | [x] | Política de backup do plano Supabase aceite pela equipa (infra) |

**Validação 10-5:** checklist considerada **fechada** em 2026-05-15.

---

## 10-6 — Vercel (ou alojamento equivalente)

**Guia passo a passo (PT):** [`guia-vercel-10-6.md`](./guia-vercel-10-6.md)

| # | Item | OK | Notas |
|---|------|----|--------|
| 1 | **Environment variables**: segredos só em Production / ambientes fechados; não expor `JWT_SECRET`, `GOOGLE_OAUTH_CLIENT_SECRET`, etc. em Preview público sem necessidade | [x] | Revisto no painel Vercel; riscos `All Environments` documentados em [`guia-vercel-10-6.md`](./guia-vercel-10-6.md) §8 |
| 2 | **Deployment Protection** (Vercel) ou auth em preview, se URLs de preview forem sensíveis | [x] | Política alinhada ao risco |
| 3 | **Domínios** de produção correctos; HTTPS forçado | [x] | Confirmado |
| 4 | **Variáveis por ambiente** alinhadas (`NEXT_PUBLIC_APP_URL`, callback Google OAuth, `DATABASE_URL`) | [x] | Production conferida com Google Cloud / Postgres |
| 5 | **Headers de segurança** (CSP, HSTS, X-Frame-Options, etc.) — ver 10-7 | [x] | `next.config.js` → `headers()` (CSP, HSTS em prod, etc.) |

**Validação 10-6:** checklist considerada **fechada** em 2026-05-15.

---

## 10-7 — Aplicação (código e config)

**Guia passo a passo (PT):** [`guia-aplicacao-10-7.md`](./guia-aplicacao-10-7.md)

### Revisão feita no repositório (2026-05-12)

| Tema | Estado | Detalhe |
|------|--------|---------|
| Rotas `app/api/admin/**` | Revisão por amostragem | Várias rotas usam `obterUserIdDoRequest` + `usuarioTemRole(..., ADMIN)` ou `obterUsuarioDoRequest` + `role === Role.ADMIN` (ex.: `margens/route.ts`, `cpm-base/route.ts`, `usuarios/route.ts`). **Recomendação:** manter checklist ao adicionar novas rotas admin. |
| `POST /api/auth/login` | Sem rate limit in-app | **Vercel Firewall / WAF** (se activo na org) cobre abuso na borda; complemento opcional: rate limit na rota ou Upstash em middleware. |
| `POST /api/auth/google/*` | Idem | Idem; callback continua protegido por `state` e allowlist de domínio. |
| **CORS** | Next default | APIs chamadas pelo mesmo origin (app Next); sem `cors()` explícito nas rotas revistas — típico para app fullstack. |
| **CSP / HSTS** | Implementado | `next.config.js` → `headers()`: CSP (dev vs prod), `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`; **HSTS** só quando `VERCEL_ENV=production`. |
| **Logs** | Evitar dados sensíveis | Regra: não logar corpo de login, tokens ou `Authorization`. Revisar `console.*` em rotas auth ao evoluir. |

### Checklist manual / complementar

| # | Item | OK | Notas |
|---|------|----|--------|
| 1 | Força de **senha** alinhada à política (mínimo **8** em criação/alteração) | [x] | `lib/auth/passwordPolicy.ts` + admin, onboarding, `change-password`, UI |
| 2 | Todas as rotas **admin** novas passam por auth + role | [x] | Amostragem confirmada; manter padrão em rotas novas |
| 3 | **Rate limit** em login (decisão: implementar onde) | [x] | Borda: **Vercel Firewall/WAF** se activo; in-app opcional (backlog) |
| 4 | **CSP** | [x] | `next.config.js` (prod mais restritiva que dev) |
| 5 | **HSTS** | [x] | Só produção Vercel (`VERCEL_ENV=production`) |
| 6 | **CORS** (estado actual same-origin) | [x] | Confirmado |
| 7 | **Logs** sem dados sensíveis em rotas auth | [x] | Revisão grep / amostragem |
| 8 | **Smoke tests** (login, Google, admin 401, alterar senha) | [x] | Validados manualmente |

**Validação 10-7:** checklist considerada **fechada** em 2026-05-15.

### Achados a abrir como issue (se prioridade)

1. Rate limiting **in-app** em `POST /api/auth/login` (opcional se WAF não bastar).
2. ~~Headers de segurança em `next.config.js`~~ — entregue (CSP + HSTS prod + restantes).
3. ~~Task 10-8~~ — entregue; ver [`PBI-10-8.md`](./PBI-10-8.md) para manutenção futura.

---

## Fecho

- **10-4:** fechado (2026-05-12).
- **10-5:** fechado (2026-05-15) — Supabase Postgres + RLS + backups documentados.
- **10-6:** fechado (2026-05-15).
- **10-7:** fechado (2026-05-15).
- **PBI-10:** todas as tasks **Done** em [`tasks.md`](./tasks.md).
- Manter este ficheiro como registo histórico; acrescentar linha com data em novas rondas de auditoria.
