# Guia prático — Auditoria da aplicação (task 10-7)

Esta auditoria mistura **revisão de código/config no repo** com **decisões de produto/segurança** e **testes manuais**. O registo oficial dos checks está em [`auditorias-seguranca.md`](./auditorias-seguranca.md) (secção **10-7**).

---

## 1. O que já foi revisto no código (referência)

Podes usar como ponto de partida a tabela **“Revisão feita no repositório”** no `auditorias-seguranca.md`. Resumo actualizado:

| Tema | Situação actual (alto nível) |
|------|------------------------------|
| Rotas `app/api/admin/**` | Amostragem: uso de `obterUserIdDoRequest` / `usuarioTemRole` ou `obterUsuarioDoRequest` + `ADMIN`. |
| `POST /api/auth/login` | Sem rate limit **na rota**; na borda usar **Vercel Firewall / WAF** (se activo na org). Opcional: rate limit in-app (Redis/Upstash) em backlog. |
| Fluxo Google OAuth | Idem na borda; `state` + allowlist de domínio no servidor. |
| CORS | Uso típico same-origin com Next fullstack. |
| CSP / HSTS | **Implementados** em `next.config.js` (`headers()`). |
| Logs | Evitar logar tokens, `Authorization`, corpo de login. |

Isto **não substitui** a tua validação: convém **repercorrer** ao evoluir o código.

---

## 2. Força de senha e política (checklist manual)

1. Política única: **`lib/auth/passwordPolicy.ts`** — `SENHA_MIN_CARACTERES = 8` usado em:
   - `app/api/admin/usuarios/route.ts` (POST) e `[id]/route.ts` (PATCH `senha`)
   - `app/api/auth/complete-onboarding/route.ts`
   - `app/api/auth/change-password/route.ts`
   - UI: `app/admin/usuarios/page.tsx`, `app/definir-senha/page.tsx`, `app/conta/ajustes/page.tsx`
2. **Login** (`POST /api/auth/login`) não exige mínimo de 8 no formulário — utilizadores com senhas antigas mais curtas ainda podem entrar até alterarem a senha.

**Checklist:** política alinhada e nota escrita? `[x]`

---

## 3. Rotas admin — garantir padrão contínuo

1. Lista pastas em `app/api/admin/` (cada `route.ts`).
2. Para **cada rota nova** no futuro: confirma que há verificação de token + role **antes** de alterar dados.
3. Faz uma **passagem rápida** agora: abre 2–3 rotas que não reviste ainda e confirma o mesmo padrão.

**Checklist:** amostragem extra feita? `[x]`

---

## 4. Rate limit no login (decisão)

1. **Primeira linha de defesa na Vercel:** [Firewall / WAF](https://vercel.com/docs/security/firewall) (regras, rate limiting na borda, bot management conforme plano). Se **já está activo** na org/projecto, regista-o no `auditorias-seguranca.md` como controlo principal para abuso em `/api/auth/*`.
2. **Defesa em profundidade (opcional):** rate limit na **rota** `login` ou middleware com store partilhado (ex. Upstash Redis) — útil se o tráfego chegar sempre ao origin.
3. Regista no doc: **“WAF Vercel + allowlist domínio; in-app N/A por agora”** ou **issue** para rate limit na app.

**Checklist:** decisão documentada? `[x]` (recomendação: WAF na borda + backlog opcional in-app)

---

## 5. CSP e HSTS (decisão técnica)

**Entregue** em `next.config.js`: CSP com `unsafe-inline` / `unsafe-eval` onde o Next ainda precisa; em **development** a CSP é mais permissiva (`connect-src` com `ws:`/`wss:`). **HSTS** só com `VERCEL_ENV === 'production'`.

**Checklist:** próximo passo definido? `[x]` — validar em staging se algum script ou iframe de terceiros for bloqueado; apertar CSP gradualmente se necessário.

---

## 6. CORS e APIs públicas

1. Se no futuro expuserem **APIs** a outros domínios (SPA noutro host), rever CORS explicitamente.
2. Hoje: uso majoritariamente **mesmo origin**.

**Checklist:** confirmado para o estado actual? `[x]`

---

## 7. Logs e dados sensíveis (verificação rápida)

1. No repo, pesquisa por `console.log` em `app/api/auth/` (e rotas sensíveis).
2. Confirma que não há impressão de passwords, tokens ou cabeçalhos completos.

**Checklist:** grep / revisão feita? `[x]`

---

## 8. Testes manuais sugeridos (smoke)

| # | Teste | OK |
|---|--------|-----|
| 1 | Login e-mail/senha com domínio permitido | [x] |
| 2 | Login Google (se activo) até ao dashboard | [x] |
| 3 | Acesso a uma rota admin sem `Authorization` → deve falhar (401/403) | [x] |
| 4 | `/conta/ajustes` — alterar senha (e “primeira senha” se conta só Google) | [x] |

**Automatizado (CI local):** `npx tsc --noEmit`, `CI=true npm run lint`, `npm run build` — correr após alterações em `next.config.js` e rotas.

---

## 9. Fechar no documento central

1. Abre [`auditorias-seguranca.md`](./auditorias-seguranca.md) → **10-7**.
2. Marca `[x]` nas linhas da **checklist manual** e nas **smoke tests** quando feitos.
3. Actualiza o estado da task **10-7** no [`tasks.md`](./tasks.md) conforme o vosso processo.

---

## Se ficares bloqueado

- **Não percebes um achado técnico** → pede a um dev para te acompanhar numa sessão de 30 min com este guia e o `auditorias-seguranca.md` abertos.
- **Queres priorizar só o crítico** → marca o resto como “backlog” com data no doc.
