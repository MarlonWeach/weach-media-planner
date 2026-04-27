# Arquitetura Tecnica
Weach Pricing and Media Recommender

Este documento descreve a arquitetura tecnica recomendada para o sistema, cobrindo backend, frontend, banco de dados, integrações, motores de precificacao, camada de IA e governanca.

A estrutura é pensada para funcionar em Next.js + Supabase + Vercel, com motor deterministico de precos e IA como camada auxiliar.

============================================================
1. OBJETIVOS DA ARQUITETURA
============================================================

- Garantir precificacao deterministica, auditavel e consistente.
- Garantir rapidez no fluxo de criacao de cotacoes.
- Facilitar manutencao, escalabilidade e logs claros.
- Separar logica de regras internas da parte de IA.
- Habilitar painel administrativo completo para tabelas de preco.
- Possibilitar futura API publica de estimativas.

============================================================
2. STACK PRINCIPAL
============================================================

Frontend:
- Next.js (App Router)
- React
- Tailwind CSS
- Shadcn UI (opcional)
- Chart.js ou Recharts para graficos simples

Backend:
- Next.js API Routes
- Supabase (Postgres gerenciado)
- Prisma ORM
- Edge functions opcionais para tarefas simples
- PDFKit ou @react-pdf para gerar PDFs

IA:
- OpenAI ou modelo equivalente
- LangChain (opcional para organizacao de prompts)
- HistoricoIA para auditoria

Infra:
- Deploy frontend: Vercel
- Banco: Supabase
- Logs: Supabase Logging ou Vercel Logs

============================================================
3. CAMADAS DO SISTEMA
============================================================

------------------------------------------------------------
3.1 Camada de Apresentacao (Frontend)
------------------------------------------------------------

Responsavel por:
- Formularios
- Wizards de cotacao
- Tabela de precos
- Edicao de mix
- Exibicao de avisos de governanca
- Geracao de PDF a partir do backend

Componentes principais:
- FormStep
- BudgetField
- RegionSelector
- PricingTable
- EditablePriceCell
- AlertBox
- IAExplanationBox

------------------------------------------------------------
3.2 Camada de API (Backend)
------------------------------------------------------------

Implementada em rotas do Next.js (api routes) ou server actions.

Funcoes:
- Receber dados do formulario
- Chamar o motor deterministico de precos
- Acionar IA para gerar plano textual
- Validar plano (IA Validator)
- Salvar cotacao no banco
- Gerar PDF

Rotas principais:
- POST /api/cotacao/criar
- GET /api/cotacao/{id}
- POST /api/cotacao/gerar-pdf
- POST /api/pricing/calcular
- GET /api/admin/tabelas
- POST /api/admin/atualizar-tabela

------------------------------------------------------------
3.3 Motor Deterministico de Precificacao (Core)
------------------------------------------------------------

Componente independente, isolado, que aplica:

- CPM base programatico (D3)
- Formular derivadas de Display, Video, CTV, Audio e Social
- Condicionais de preco baseadas em D3
- Cenarios por faixa de budget (5, 10, 15 porcento)
- Pisos, tetos e margens minimas
- Ajustes regionais

Formato:
- Modulo TypeScript puro
- Sem IA
- 100% reproduzivel e auditavel

Exemplo de estrutura:
pricing/
  calculoPrecos.ts
  cenarios.ts
  formulasProgramaticas.ts
  regrasGovernanca.ts

------------------------------------------------------------
3.4 Camada de IA (Assistiva)
------------------------------------------------------------

Nao interfere no preco.

Responsavel por:
- Criar mix de midia
- Criar resumo executivo
- Explicar racional
- Validar consistencia
- Criar insights

Todos os prompts sao armazenados no HistoricoIA.

------------------------------------------------------------
3.5 Banco de Dados (Postgres Supabase)
------------------------------------------------------------

Tabelas essenciais:

usuarios
cotacoes
precos_base
log_alteracoes_preco
historico_ia
configuracoes (cpmbase, parametros)

Indices recomendados:
- por segmento
- por data
- por vendedor
- por status

------------------------------------------------------------
3.6 Autenticacao e Autorizacao
------------------------------------------------------------

Controle por roles:
- admin
- comercial
- externo (opcional)

Recursos:
- Supabase Auth ou NextAuth
- Politicas RLS (row level security)
- Tokens de acesso para API interna

------------------------------------------------------------
3.7 Logs e Auditoria
------------------------------------------------------------

Registros obrigatorios:
- Alteracoes de preco
- Prompts enviados a IA
- Modelos usados
- PDFs gerados
- Acessos de usuario
- Mudancas de regra de precificacao

============================================================
4. FLUXO TECNICO COMPLETO
============================================================

1. Usuario envia formulario.
2. API recebe dados.
3. IA Media Planner sugere mix.
4. Motor deterministico aplica:
   - precos
   - cenarios
   - margens
   - tetos
5. IA Explainer cria texto comercial.
6. API salva tudo no banco.
7. API gera PDF via PDFKit.
8. Usuario baixa ou envia ao cliente.

============================================================
5. ESTRUTURA SUGERIDA DE PASTAS
============================================================

app/
  cotacao/
  admin/
  api/
    cotacao/
    pricing/
    admin/
lib/
  pricing/
  ia/
  utils/
components/
  ui/
  cotacao/
  admin/
public/
docs/

============================================================
6. INTEGRACOES FUTURAS
============================================================

- Conexao com Meta Ads API (para lead ads)
- Conexao com DV360 para leitura de volumes
- API publica de estimativas simples
- Retencao automatica de logs de performance

============================================================
7. REQUISITOS DE PERFORMANCE
============================================================

- Tempo de geracao de plano: menor que 3 segundos
- Tempo de geracao de PDF: menor que 5 segundos
- Tabelas com cache em memoria quando possivel
- IA chamada apenas quando necessario (minimizacao de custo)

============================================================
8. REQUISITOS DE SEGURANCA
============================================================

- HTTPS sempre
- Dados sensiveis criptografados
- Permissoes por role
- Auditoria total de precos
- Logs imutaveis por 24 meses

============================================================
9. RESUMO DA ARQUITETURA
============================================================

- Pricing = deterministico  
- IA = assistiva  
- Banco = Supabase  
- Front = Next.js  
- PDF = PDFKit  
- Governanca = forte  

Essa arquitetura garante que o sistema seja rapido, auditavel, seguro e escalavel, mantendo todo o controle de precos dentro da Weach e usando IA apenas para apoio operacional e narrativo.