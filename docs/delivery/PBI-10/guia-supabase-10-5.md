# Guia prático — Auditoria Supabase (task 10-5)

Este guia ajuda a **confirmar se o Supabase é usado** por esta app ou por dados ligados, e **o que rever** se existir projecto Supabase.

**Contexto do código deste repo:** a app **Media Planner** usa **PostgreSQL via Prisma** (`DATABASE_URL`). Não há `createClient` do Supabase no código — o projecto Supabase pode ser **só o hosting da base** (Postgres). Nesse caso **não** precisas de `anon` na env da app Next, a menos que no futuro cries cliente Supabase no browser.

---

## Perguntas frequentes: URL, `anon` e `service_role` na `.env`

### Project URL (`https://xxxxx.supabase.co`)

| Uso | Colocar na env? |
|-----|------------------|
| App **só** com Prisma (liga directo ao Postgres com connection string) | **Não é obrigatório** ter a “Project URL” numa variável à parte; o host já vai dentro de `DATABASE_URL` / `DIRECT_URL`. |
| App ou script com **Supabase JS** (`createClient`) | Sim: normalmente `NEXT_PUBLIC_SUPABASE_URL` (ou nome que a equipa padronizar) = essa URL. |

### Chave **anon** (“public”, “publishable”)

| Uso | Colocar na env? |
|-----|------------------|
| **Nenhum** código browser/server chama `supabase.from()` / Auth do Supabase neste repo | **Não precisas** de `anon` na env da app. Guarda-a só no painel para referência ou para outras ferramentas. |
| Forem usar dashboard, Edge Functions ou outro serviço com **cliente anon** | Aí sim: no **browser** seria `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ou o nome actual “publishable key” no painel **API**). **Nunca** `service_role` com `NEXT_PUBLIC_`. |

### Chave **service_role**

| Regra | Detalhe |
|-------|---------|
| Onde | **Só** variável de **servidor** (ex.: `SUPABASE_SERVICE_ROLE_KEY`) — **sem** prefixo `NEXT_PUBLIC_`. |
| Quando | Scripts de admin, migrações, jobs que precisem **ignorar RLS** com cuidado extremo. |
| Esta app Next | Se **não** tens código que use `service_role`, **não** é obrigatório ter na `.env` do Media Planner. |

**Resumo para o vosso caso (Prisma + Supabase como Postgres):** o mínimo típico é **`DATABASE_URL`** + **`DIRECT_URL`** (Settings → **Database** → *Connection string*, modo *URI* / *Session* conforme a doc Prisma + Supabase). URL projecto + `anon` + `service_role` são **opcionais** na app até precisarem do SDK Supabase.

---

## Onde ver e editar RLS no painel (passo a passo)

O menu mudou ao longo do tempo; tenta por esta ordem:

1. **Database** (ícone de base de dados na barra lateral) → **Tables**.
2. Clica numa tabela (ex.: `wp_Usuario`).
3. Procura o separador **Policies** ou **RLS** / “Row Level Security” (por vezes está no topo da página da tabela, ou num menu **…**).
4. Alternativa: **SQL Editor** — podes listar políticas com consultas a `pg_policies` (avançado).

Se **não** aparecer “Policies” à primeira vista: na mesma área **Database**, abre **Advisors** (onde viste os avisos) — confirma que estás no projecto correcto; os lints já te dizem quais tabelas têm RLS sem políticas.

---

## Advisors: os teus 2 WARN + 11 INFO (o que significam)

### WARN — `public.rls_auto_enable()` (SECURITY DEFINER + `anon` / `authenticated`)

- A função corre com **privilégios elevados** e está **exposta via API** (`/rest/v1/rpc/rls_auto_enable`) a `anon` e `authenticated`.
- **Risco:** se a função fizer algo sensível, quem tiver a chave **anon** (pública) ou sessão autenticada Supabase pode invocá-la.
- **O que fazer:** seguir a [remediação do Supabase](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) — em geral: **revogar `EXECUTE`** a `anon` (e a `authenticated` se não for necessário), ou mudar para **`SECURITY INVOKER`**, ou tirar a função do API exposto se não for para ser pública. **Quem gere a base** (SQL) deve aplicar isto; não é configuração num ecrã “Authentication”.

#### Passo a passo rápido (recomendado — resolve os **dois** WARN de uma vez)

1. No Supabase: **SQL Editor** → novo query.
2. Copia o conteúdo de **[`sql/fix-rls-auto-enable-warn.sql`](./sql/fix-rls-auto-enable-warn.sql)** (ou o bloco abaixo) e executa **Run**.
3. Confirma que as duas queries finais devolvem **`f`** (false).
4. Volta a **Database → Advisors** e espera o próximo lint (ou revalida) — os dois avisos sobre `rls_auto_enable` devem desaparecer.

```sql
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
-- Opcional: se precisares do RPC só com service_role (Edge Function, etc.):
-- GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;
```

**Se o `REVOKE` der erro** (“function does not exist” ou assinatura diferente), no SQL Editor corre primeiro:

```sql
SELECT p.oid::regprocedure AS signature
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable';
```

Usa o valor exacto de `signature` no lugar de `public.rls_auto_enable()` nos comandos `REVOKE` (ex.: se aparecer argumentos, fica `public.rls_auto_enable(uuid)`).

**Alternativa (só se a equipa DB confirmar):** `ALTER FUNCTION public.rls_auto_enable() SECURITY INVOKER;` — pode **partir** o propósito da função se ela precisar de correr com privilégios do dono; por isso o caminho **REVOKE** costuma ser o mais seguro para fechar o buraco na API.

### INFO — “RLS enabled no policy” (várias `wp_*`)

- Significa: **RLS ligado** na tabela mas **zero políticas** criadas.
- **Via PostgREST** (chave `anon` no browser): o comportamento por omissão costuma ser **negar tudo** — não “abre” dados, mas também não há regras explícitas.
- **Via Prisma** com connection string do pooler: o papel da ligação muitas vezes **não** é o mesmo que `anon`; muitas apps **só** usam Postgres e o aviso é **higiene** para o dia em que alguém usar o client Supabase no front sem políticas.
- **Plano de acção:** (1) Se vão usar **Supabase client** no browser → **criar políticas** por tabela/regra de negócio. (2) Se **nunca** expõem dados via REST com `anon` → documentar “dados só via Prisma servidor”; opcionalmente **desligar RLS** nessas tabelas só se a equipa DB aceitar o trade-off (menos comum no Supabase). (3) Melhor: **políticas explícitas** ou revisão com DBA.

#### Script pronto (INFO “RLS enabled, no policies”)

Ficheiro no repo: **[`sql/fix-rls-enabled-no-policies.sql`](./sql/fix-rls-enabled-no-policies.sql)** — executa a **Opção B** no SQL Editor: cria a política `pbi10_block_anon_authenticated` em cada tabela `wp_*` (nega `anon` e `authenticated`). Depois corre a query de **verificação** no fim do ficheiro; o resultado deve ser **0 linhas**.

- **Atenção:** se algum cliente ligar à base com o papel **`authenticated`** ou **`anon`** e precisar de ler estas tabelas, fica bloqueado — confirma que o Prisma usa papel de serviço / `postgres` conforme o vosso `DATABASE_URL`.
- **Opção A** no mesmo ficheiro (comentada): `DISABLE ROW LEVEL SECURITY` — só se decidirem não usar RLS nestas tabelas; **não** misturar com a Opção B na mesma execução.

Regista no [`auditorias-seguranca.md`](./auditorias-seguranca.md) a decisão e, se aplicável, issue para corrigir `rls_auto_enable` e as políticas.

---

## Authentication — o que fazer “onde e como” (quando o login **não** é Supabase)

O login do **Media Planner** (JWT, Google OAuth na Next, etc.) **não** passa obrigatoriamente pelo **Supabase Auth**. Mesmo assim convém deixar o painel coerente:

1. No dashboard: **Authentication** → **URL configuration** (ou **Providers** / **Sign In / Providers** conforme a UI).
2. **Site URL:** URL de produção da app (ex.: `https://o-teu-dominio.vercel.app` ou domínio final). É o “default redirect” para fluxos **do Supabase Auth** (magic link, reset password **do Supabase**, etc.).
3. **Redirect URLs:** lista de URLs **permitidas** para redireccionamentos de auth **do Supabase** (inclui `http://localhost:3000/**` para dev se algum dia usarem Supabase Auth localmente).
4. **Providers (Google, etc.):** se **não** usam login Google **através** do Supabase, podes **deixar desligados** ou ignorar — o Google OAuth da vossa app é no **Google Cloud + Next**, não neste ecrã.
5. **Utilizadores:** só relevantes se criarem users no Supabase Auth; o vosso `wp_Usuario` é no Postgres e pode ser independente.

**Checklist honesto:** “Supabase Auth **não** usado para esta app; URL configuration preenchida para evitar surpresas futuras” **ou** “Auth Supabase em uso — Site URL + Redirect URLs alinhados com prod/staging”.

---

## 1. Responder: “Usamos Supabase para esta app?”

Percorre estes pontos (podes marcar no [`auditorias-seguranca.md`](./auditorias-seguranca.md)):

1. **Produção / staging:** existe URL ou projecto **Supabase** (painel em [https://supabase.com/dashboard](https://supabase.com/dashboard)) que alimente **esta** aplicação (auth, tabelas, storage)?
2. **Outros produtos** da mesma empresa usam Supabase mas **este** repo só fala com Postgres? → Para **esta** task, podes registar **N/A para weach-media-planner**, com nota “dados noutro sistema”.
3. **Pacote no repo:** existe `@supabase/supabase-js` no `package.json` — no vosso caso pode ser dependência residual ou uso futuro; confirma no **código** se há `createClient` do Supabase em runtime.

**Decisão:**  
- Se **não** há projecto Supabase ligado a esta app → preenche a secção 10-5 no `auditorias-seguranca.md` com **N/A + uma linha de justificativa** e marca o item “Confirmar se algum ambiente usa Supabase” como `[x]`.  
- Se o projecto existe e a app usa **só Postgres** (Prisma com `DATABASE_URL` apontando ao Supabase), sem SDK no browser → regista **“Supabase = hospedagem Postgres; Auth/anon opcionais”** e segue as secções de Advisors / RLS conforme risco.  
- Se também usam **Supabase Auth ou client no browser** → segue a secção 2 abaixo em detalhe.

---

## 2. Se existir projecto Supabase (painel)

Abre o projecto correcto em [Supabase Dashboard](https://supabase.com/dashboard).

### 2.1. Chaves e segredos

1. **Definições do projecto** (*Project Settings*) → **API**.
2. Anota (sem partilhar em público):
   - **Project URL**
   - **`anon` `public`** — pode ir a código **browser** se usares Supabase no cliente; políticas **RLS** têm de proteger dados.
   - **`service_role`** — **nunca** em `NEXT_PUBLIC_*`, nunca em repositório, nunca no browser. Só servidor / Vercel env fechado.

**Checklist:** `service_role` só onde deve estar? `[x]`

### 2.2. Row Level Security (RLS)

1. **Base de dados** (*Database*) → **Tables** (ou Editor SQL).
2. Para cada tabela exposta ao **`anon`** (via API REST ou cliente):
   - Confirma se **RLS está activo** e se há **políticas** que limitem leitura/escrita ao utilizador correcto.

**Checklist:** tabelas sensíveis com RLS + políticas revistas? `[x]`

### 2.3. Auth (se usarem Supabase Auth)

1. **Authentication** → **Providers**, **URL configuration** (redirects, site URL).
2. Alinha com os domínios reais da app (produção vs preview).

**Checklist:** redirects e domínios correctos? `[x]`

### 2.4. Backups e recuperação

1. **Definições do projecto** → **Database** (ou Add-ons) → verifica **backups** / PITR conforme o plano pago.
2. Regista na org qual é o **RTO/RPO** aceitável.

**Checklist:** política de backup documentada? `[x]`

---

## 3. Fechar a task no documento central

1. Abre [`auditorias-seguranca.md`](./auditorias-seguranca.md).
2. Na secção **10-5**, marca `[x]` nas linhas que aplicarem (ou N/A na primeira tabela + justificativa).
3. Quando estiveres satisfeito, pede a quem gere o `tasks.md` para passar **10-5** a **Done** (ou marca tu conforme o processo interno).

---

## Se ficares bloqueado

- **Não tens login no Supabase** → pede ao owner do projecto na org.
- **Não sabes se há projecto** → pergunta à equipa de infra / quem criou a base; entretanto regista **“N/A — não identificado projecto Supabase para esta app”**.
