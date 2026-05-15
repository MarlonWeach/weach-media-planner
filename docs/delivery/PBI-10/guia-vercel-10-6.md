# Guia prático — Auditoria Vercel (task 10-6)

Assume que o projecto está alojado na **Vercel** ([https://vercel.com](https://vercel.com)). Se usarem outro host (Railway, Fly, etc.), adapta os nomes dos menus.

**Pré-requisito:** conta com acesso ao **team** e ao **projecto** onde a app está deployada.

---

## 1. Abrir o projecto correcto

1. Login em [https://vercel.com/dashboard](https://vercel.com/dashboard).
2. Escolhe o **team** (organização) correcto.
3. Abre o **projecto** da aplicação (ex.: `weach-media-planner`).

---

## 2. Variáveis de ambiente (segredos)

1. No projecto: **Settings** (*Definições*).
2. Menu **Environment Variables**.
3. Para cada segredo (`JWT_SECRET`, `DATABASE_URL`, `GOOGLE_OAUTH_CLIENT_SECRET`, `DIRECT_URL`, etc.):
   - Confirma em que **ambientes** está: **Production**, **Preview**, **Development**.
   - **Regra:** segredos não devem estar em **Preview** se os deployments de PR forem **públicos** e não precisarem daquele segredo (ou usa valores “dummy” só para build).
4. Verifica se **não** há variáveis `NEXT_PUBLIC_*` com valores secretos (o prefixo expõe ao browser).

**Checklist:** revista feita e notas no [`auditorias-seguranca.md`](./auditorias-seguranca.md)? `[x]`

---

## 3. Deployment Protection (previews e produção)

1. **Settings** → **Deployment Protection** (ou **Security** conforme a UI actual).
2. Se os URLs de **Preview** expõem dados reais ou a app completa:
   - Activa **Vercel Authentication** (ou password / allowlist) para previews.
3. Produção: confirma se o domínio público é o desejado e se **não** há deploy acidental sem protecção.

**Checklist:** política de previews alinhada ao risco? `[x]`

---

## 4. Domínios e HTTPS

1. **Settings** → **Domains**.
2. Lista: domínio de **produção** (apex + `www` se aplicável), redirects.
3. Confirma que o browser mostra **cadeado** (HTTPS) e que certificados renovam (normalmente automático na Vercel).

**Checklist:** domínios e HTTPS validados? `[x]`

---

## 5. Variáveis alinhadas ao produto

Confirma (com a equipa) que existem e estão correctas em **Production**:

| Variável (exemplos) | Para quê |
|---------------------|----------|
| `NEXT_PUBLIC_APP_URL` | Links em e-mails, redirects |
| `DATABASE_URL` / `DIRECT_URL` | Prisma / Postgres |
| `GOOGLE_OAUTH_*` / `GOOGLE_OAUTH_REDIRECT_URI` | Login Google |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Sessão |

**Checklist:** valores conferidos com o que está no Google Cloud / Postgres? `[x]`

---

## 6. Headers de segurança (ligação com 10-7)

Implementado em **`next.config.js`**: `headers()` com CSP (modo **desenvolvimento** mais permissivo para HMR), `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, e **HSTS** apenas quando `VERCEL_ENV === 'production'`. Detalhes no código.

**Checklist:** decisão registada (implementar depois vs. aceitar risco)? `[x]` — headers activos; rever em staging se algum recurso externo for bloqueado pela CSP.

---

## 7. Equipa e permissões Vercel

1. **Settings** → **General** → **Team** / membros do projecto.
2. Confirma que só quem precisa tem **Owner** vs **Member**; evita contas partilhadas genéricas sem 2FA.

**Checklist:** membros revistos? `[x]`

---

## 8. Revisão de variáveis (exemplo — levantamento interno)

Use esta tabela quando fizeres a auditoria no painel Vercel. **Não** coloques valores secretos no Git.

### Variáveis que listaste

| Variável | Ambiente na Vercel | Avaliação | Acção sugerida |
|----------|-------------------|-----------|----------------|
| `DATABASE_URL` | All | **Risco se Preview = mesma base que produção:** qualquer PR com URL pública pode correr código contra a **BD de prod**. | Ideal: **Production** só com URL de prod; **Preview** com base de *branch* / *staging* **diferente** (outra `DATABASE_URL`). Se os previews **não** precisam de BD, remove de Preview. |
| `JWT_SECRET` | All | Mesmo segredo em Preview e Prod: tokens de preview **não** devem ser válidos em prod — em geral usa-se **segredo diferente** por ambiente. | **Production** um valor; **Preview** outro (e Development outro se usarem). |
| `OPENAI_API_KEY` | All | Cada deploy de PR pode consumir **quota/custo** OpenAI. | Chave **só Production** se previews não precisarem de IA; ou chave **só para Preview** com limite baixo / projecto separado. |
| `SMTP_*`, `EMAIL_*` (várias) | Production and Preview (Sensitive) | Previews podem **enviar e-mail real** para CC/endereços de prod se o código disparar notificações. | Preferir: **Production** só; ou variáveis de Preview com **Mailtrap** / endereços de teste; ou desligar envio em `VERCEL_ENV=preview` no código. |
| *(não listaste)* `GOOGLE_OAUTH_*`, `DIRECT_URL`, `NEXT_PUBLIC_APP_URL`, `SMTP_HOST`, `EMAIL_COTACAO_TO` | — | O código usa estas para OAuth, Prisma e e-mail. | Confirmar que existem em **Production**; `GOOGLE_OAUTH_REDIRECT_URI` deve bater com o domínio do deploy (incl. preview se OAuth em PR). |

### Resumo

- **Obrigatório rever:** `DATABASE_URL` + `JWT_SECRET` + `OPENAI_API_KEY` em **All Environments** — são as que mais costumam merecer **escopos separados** (Production vs Preview).
- **E-mail em Preview:** decidir conscientemente se querem envio real a partir de PRs.
- **Nada na tua lista** está em `NEXT_PUBLIC_*` com segredo (bom).

Depois de ajustares, regista uma linha em [`auditorias-seguranca.md`](./auditorias-seguranca.md) (secção 10-6, coluna Notas).

---

## 9. Fechar no documento central

1. Abre [`auditorias-seguranca.md`](./auditorias-seguranca.md) → secção **10-6**.
2. Marca cada linha `[x]` quando confirmado.
3. Actualiza o estado da task **10-6** no [`tasks.md`](./tasks.md) conforme o vosso processo (só **Done** depois de validares).

---

## Se ficares bloqueado

- **Não vês Settings** → precisas de role mais alto no projecto ou no team.
- **Build falha por env em falta** → adiciona a variável no ambiente correcto (Production vs Preview) e redeploy.
