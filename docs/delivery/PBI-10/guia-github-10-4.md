# Guia prático — Auditoria GitHub (task 10-4)

Este guia assume **GitHub.com** (não Enterprise Server). Os menus podem mudar ligeiramente de nome (PT/EN); indicamos os nomes em **português** quando existirem.

**Pré-requisito:** tens de ser **administrador do repositório** ou da **organização** para várias destas opções.

---

## 1. Abrir o repositório certo

1. Vai a [https://github.com](https://github.com) e faz login.
2. Abre o repositório do projecto (ex.: `weachgroup/weach-media-planner`).

---

## 2. Proteger o branch `main` (branch protection)

1. No repositório: **Definições** (*Settings*).
2. Menu lateral: **Branches** (*Branches*).
3. Em **Regras de proteção de branch** (*Branch protection rules*), clica **Adicionar regra de proteção de branch** (*Add branch protection rule*).
4. Em **Nome do padrão de branch** (*Branch name pattern*), escreve: `main` (ou o nome do branch de produção).
5. Activa pelo menos:
   - **Exigir um pull request antes de fazer merge** (*Require a pull request before merging*) — opcionalmente define número mínimo de aprovações (ex.: 1).
   - **Exigir revisões de código** (*Require approvals*) — se a opção existir no teu plano.
   - **Exigir verificações de estado** (*Require status checks to pass before merging*) — só podes ligar isto **depois** de existir pelo menos um workflow no repo que publique um check (ver **§2b** abaixo). No campo de pesquisa, escolhe por exemplo **`CI`** ou **`checks`** (nome do job no ficheiro `.github/workflows/ci.yml`).
   - **Não permitir bypass** (*Do not allow bypassing the above settings*) — para administradores também, se fizer sentido para a equipa.
6. **Guardar** / **Criar** a regra.

### 2b. Erro: “Required status checks cannot be empty”

O GitHub **obriga** a escolher **pelo menos um** check na lista. Se o repositório **ainda não tiver** GitHub Actions (ou nunca correu um workflow em `main`), a lista fica vazia e aparece esse erro.

**Caminho A — Já existe `.github/workflows/ci.yml` no repo (recomendado)**  
1. Faz **merge** desse ficheiro para `main` (por um PR normal).  
2. Espera que o workflow **CI** corra pelo menos uma vez com sucesso (separador **Actions** no GitHub).  
3. Volta a **Definições → Branches →** editar a regra: em **Status checks**, pesquisa **`CI`** ou **`checks`** e adiciona o que aparecer (o nome exacto pode ser `CI / checks` conforme a UI).  
4. Guarda a regra.

**Caminho B — Ainda não queres CI**  
1. Desliga **“Require status checks to pass before merging”** (deixa desmarcado).  
2. Podes manter **“Require pull request”** e revisões sem exigir checks até teres workflow.

**Nota:** Se o botão *Settings* não aparecer, não tens permissões de admin no repo — pede a quem gere a org.

---

## 3. Dependabot (alertas e PRs de dependências)

1. **Definições** → **Segurança e análise de código** (*Code security and analysis*), ou **Segurança** → **Dependabot**.
2. Activa:
   - **Dependabot alerts** — avisos de vulnerabilidades.
   - **Dependabot security updates** — PRs automáticos para corrigir CVEs (quando o GitHub consegue).
3. (Opcional) Ficheiro `.github/dependabot.yml` na raiz do repo para **version updates** semanais — isso é alteração de código; podes pedir a um dev para adicionar.

Depois: no separador **Segurança** (*Security*) do repo, abre **Dependabot** e **vai triando** alertas críticos/altos.

---

## 4. Secret scanning (detecção de segredos no código)

- Em repositórios **públicos**, muitas funcionalidades já estão disponíveis.
- Em repositórios **privados**, **secret scanning** avançado e **push protection** podem exigir **GitHub Advanced Security** (pago por org/repo).

**Onde ver:** **Definições** → **Segurança e análise de código** → procura **Secret scanning** / **Push protection**.

Se não estiver disponível: documenta no [`auditorias-seguranca.md`](./auditorias-seguranca.md) como **“N/A — plano actual”** e combina upgrade com a org.

---

## 5. Collaborators (quem tem acesso ao código)

1. **Definições** → **Collaborators** (*Collaborators and teams*) ou **Equipas** na org.
2. Lista quem tem **Write** ou **Admin**; remove contas que já não precisam.
3. Confirma que **2FA** está ligada nas contas com acesso (ver secção 7).

---

## 6. PATs (Personal Access Tokens) e chaves

Isto **não** está num único ecrã do repo; é por utilizador:

1. Cada pessoa: avatar (canto superior direito) → **Definições** (*Settings*) da **conta GitHub** (não do repo).
2. **Definições do programador** (*Developer settings*) → **Tokens de acesso pessoal** (*Personal access tokens*).
3. Revogar tokens antigos ou com scopes demasiado largos.

Na **organização**: **Definições da organização** → **Segurança** → políticas de **Personal access tokens** (se existir no vosso plano).

---

## 7. 2FA obrigatório na organização (recomendado)

1. **Organização** → **Definições** (*Settings*).
2. **Segurança de autenticação** (*Authentication security*) ou **Segurança** → **Two-factor authentication requirement**.
3. Activa **exigir 2FA** para todos os membros.

---

## 8. Registar o que fizeste

No ficheiro [`auditorias-seguranca.md`](./auditorias-seguranca.md), na secção **10-4**, marca as linhas da tabela com `[x]` e adiciona uma nota com **data** e **quem validou**.

---

## Se ficares bloqueado

- **“Required status checks cannot be empty”** → lê o **§2b** do guia; ou desliga “Require status checks” até o workflow `CI` correr em `main`, ou faz merge do `.github/workflows/ci.yml` e escolhe o check **`CI` / `checks`** na lista.
- **“Não vejo Settings”** → não és admin do repo; pede acesso ou que outra pessoa aplique a regra.
- **“Dependabot não cria PRs”** → verifica permissões do GitHub Actions e o ficheiro `dependabot.yml` se existir.
- **Dúvidas de plano GitHub** → o dono da faturação da org (billing admin) confirma se tens Advanced Security.
