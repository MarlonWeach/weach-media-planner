# Weach Pricing & Media Recommender

Sistema de geração automática de planos de mídia e precificação para a Weach.

## 🎯 Visão Geral

Este sistema combina:
- **Motor Determinístico de Precificação**: Cálculos precisos baseados em fórmulas matemáticas
- **IA Assistiva**: Geração inteligente de mix de mídia e explicações comerciais
- **Governança Rigorosa**: Controle de margens, pisos e tetos de preço

## 🚀 Tecnologias

- **Next.js 20** (App Router)
- **TypeScript**
- **Prisma** (ORM)
- **PostgreSQL** (via Supabase)
- **Supabase JS** (cliente e integração com PostgreSQL)
- **OpenAI** (GPT-4o-mini)
- **Tailwind CSS**
- **Zod** (validação)

## 📋 Pré-requisitos

- Node.js 20 LTS+
- PostgreSQL (ou conta Supabase)
- Conta OpenAI (para funcionalidades de IA)

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone <repo-url>
cd weach-media-planner
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
touch .env
```

Edite o arquivo `.env` com suas credenciais:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/weach_media_planner"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
OPENAI_API_KEY="sk-..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Variáveis usadas pela aplicação:
- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL`

4. Configure o banco de dados:
```bash
# Gerar cliente Prisma
npm run db:generate

# Criar/atualizar schema no banco
npm run db:push

# Ou criar migração
npm run db:migrate
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
weach-media-planner/
├── app/                    # Next.js App Router
│   ├── api/               # Rotas de API
│   │   ├── cotacao/       # Endpoints de cotação
│   │   └── pricing/       # Endpoints de precificação
│   ├── cotacao/           # Páginas de cotação
│   └── dashboard/         # Dashboard
├── lib/
│   ├── pricing/           # Motor determinístico
│   │   ├── formulasProgramaticas.ts
│   │   ├── cenarios.ts
│   │   ├── regrasGovernanca.ts
│   │   └── calculoPrecos.ts
│   ├── ia/                # Agentes de IA
│   │   ├── mediaPlanner.ts
│   │   └── explainer.ts
│   └── prisma.ts          # Cliente Prisma
├── prisma/
│   └── schema.prisma      # Schema do banco
└── docs/                  # Documentação completa
```

## 🎨 Funcionalidades Principais

### Motor Determinístico de Precificação

O sistema calcula preços baseados em:
- **CPM Base Programático (D3)**: Valor central que determina todos os preços
- **Fórmulas Derivadas**: Display, Vídeo, CTV, Áudio, Social
- **Cenários por Budget**: Descontos progressivos (5%, 10%, 15%)
- **Multiplicadores Regionais**: Ajustes por região geográfica
- **Regras de Governança**: Pisos, tetos e margens mínimas

### Agentes de IA

1. **Media Planner**: Gera mix de canais e distribuição de budget
2. **Explainer**: Cria textos comerciais explicativos

### Autenticação

O sistema utiliza JWT (JSON Web Tokens) para autenticação:
- `POST /api/auth/login` - Login de usuário
- `GET /api/auth/me` - Obter usuário atual
- `POST /api/auth/logout` - Logout

**Roles disponíveis:**
- `ADMIN` - Acesso completo ao sistema e painel admin
- `COMERCIAL` - Pode criar e gerenciar cotações
- `EXTERNO` - Acesso limitado (futuro)

### API Endpoints

- `POST /api/cotacao/criar` - Cria nova cotação
- `GET /api/cotacao/{id}` - Obter cotação específica
- `GET /api/cotacao/list` - Listar cotações
- `POST /api/cotacao/rascunho` - Salvar rascunho
- `POST /api/pricing/calcular` - Calcula preços

## 📚 Documentação

Toda a documentação está na pasta `docs/`:

- `01-visao-geral-weach-pricing-media-recommender.md`
- `02-requisitos-funcionais.md`
- `05-regras-de-negocio-pricing.md`
- `06-tabelas-de-preco-base.md`
- `11-arquitetura-tecnica.md`
- `12-roadmap.md`

## 🔒 Governança de Preços

O sistema garante:
- ✅ Preços sempre dentro de pisos e tetos
- ✅ Margens mínimas respeitadas
- ✅ Auditoria completa de alterações
- ✅ Logs de todas as operações de IA

## 🛠️ Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Inicia servidor de produção
npm run lint         # Executa linter
npm run db:generate  # Gera cliente Prisma
npm run db:push      # Atualiza schema no banco
npm run db:migrate   # Cria migração
npm run db:studio    # Abre Prisma Studio
```

## 📝 Próximos Passos

Consulte o `docs/12-roadmap.md` para ver o plano completo de desenvolvimento.

**Fase 1 (MVP)** - ✅ Concluída
- Motor determinístico
- Wizard de cotação (4 passos)
- Geração de PDF
- Dashboard inicial
- Agentes de IA

**Fase 2** - 🔄 Em desenvolvimento
- Painel admin para governança de preços
- Tabelas de valores fixos e condicionais
- Margens mínimas, pisos e tetos
- Auditoria e visualização de logs

## 🤝 Contribuindo

Este é um projeto interno da Weach. Para contribuições, consulte a documentação em `docs/rules/rules-development.md`.

## 📄 Licença

Proprietário - Weach

