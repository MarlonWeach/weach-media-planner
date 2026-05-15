# PBI-10 — Índice de documentos (segurança e auditorias)

| Ficheiro | Conteúdo |
|----------|----------|
| [`tasks.md`](./tasks.md) | Lista de tasks 10-1 … 10-8 e estado |
| [`prd.md`](./prd.md) | Contexto do PBI |
| [`auditorias-seguranca.md`](./auditorias-seguranca.md) | **Checklists** 10-4 a 10-7 (marcar `[x]` à medida que validas) |
| [`guia-github-10-4.md`](./guia-github-10-4.md) | Passo a passo **GitHub** (branch protection, Dependabot, etc.) |
| [`guia-supabase-10-5.md`](./guia-supabase-10-5.md) | Passo a passo **Supabase** (ou N/A) |
| [`guia-vercel-10-6.md`](./guia-vercel-10-6.md) | Passo a passo **Vercel** (env, domínios, protecção) |
| [`guia-aplicacao-10-7.md`](./guia-aplicacao-10-7.md) | Passo a passo **aplicação** (código, políticas, smoke tests) |
| [`PBI-10-8.md`](./PBI-10-8.md) | Primeira senha pós-Google (`senhaLocalConfigurada`) |
| [`sql/fix-rls-auto-enable-warn.sql`](./sql/fix-rls-auto-enable-warn.sql) | SQL: corrigir WARN `rls_auto_enable` (SECURITY DEFINER) |
| [`sql/fix-rls-enabled-no-policies.sql`](./sql/fix-rls-enabled-no-policies.sql) | SQL: corrigir INFO RLS sem políticas (`wp_*`) |

**Fluxo sugerido:** lê o guia da task → preenche a secção correspondente em `auditorias-seguranca.md` → quando estiver tudo validado, marca a task **Done** em `tasks.md`.
