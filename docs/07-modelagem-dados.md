# Modelagem de Dados — Weach Pricing & Media Recommender

---

Este documento descreve as entidades principais, seus campos e relações, pensado para rodar em um backend com PostgreSQL (por exemplo Supabase) e ORM (ex.: Prisma).

---

## 1. Visão Geral

Entidades principais:

- Usuario
- Cotacao
- PrecoBase
- LogAlteracoesPreco
- HistoricoIA

Alguns campos são armazenados como JSON para permitir flexibilidade de mix, preços por canal e estimativas.

---

## 2. Entidades

### 2.1. Usuario

Representa usuários internos (comercial, gestor) e eventualmente externos autenticados (parceiros).

Campos principais:

- id (uuid)
- nome (string)
- email (string, único)
- senha_hash (string)
- role (enum: "admin", "comercial", "externo")
- ativo (boolean)
- created_at (timestamp)
- updated_at (timestamp)

---

### 2.2. Cotacao

Representa uma cotação de mídia criada pelo sistema.

Campos principais:

- id (uuid)
- created_at (timestamp)
- updated_at (timestamp)

- cliente_nome (string)
- cliente_segmento (string / enum)
- url_lp (string)
- objetivo (string / enum: awareness, consideração, leads, vendas etc.)
- budget (decimal)
- data_inicio (date)
- data_fim (date)
- regiao (string / enum)
- maturidade_digital (string / enum: baixa, média, alta)
- risco (string / enum: baixa, média, alta)
- aceita_modelo_hibrido (boolean)
- observacoes (text)

- mix_sugerido (jsonb)
  - Ex.: lista de canais, percentuais, formatos recomendados
- precos_sugeridos (jsonb)
  - Ex.: preços por canal x formato x modelo de compra
- estimativas (jsonb)
  - Ex.: impressões, alcance, cliques, leads estimados

- pdf_url (string, opcional)
- status (string / enum: rascunho, enviado, aprovado, recusado etc.)

- vendedor_id (uuid, FK → Usuario.id)

---

### 2.3. PrecoBase

Tabela com os preços base (piso, alvo, teto) por combinação de canal/segmento/região/modelo.

Campos principais:

- id (uuid)
- created_at (timestamp)
- updated_at (timestamp)

- canal (string / enum: display, vídeo, ctv, native, crm, social, in_live)
- segmento (string / enum)
- regiao (string / enum)
- formato (string)
- modelo_compra (string / enum: cpm, cpc, cpv, cpl, cpa, cpd)

- preco_min (decimal)
- preco_alvo (decimal)
- preco_max (decimal)

Observação:
- Essa tabela é abastecida manualmente com base no arquivo `06-tabelas-de-preco-base.md`.

---

### 2.4. LogAlteracoesPreco

Registra qualquer alteração de preço manual feita pelo usuário em uma cotação, para fins de auditoria e governança.

Campos principais:

- id (uuid)
- created_at (timestamp)

- cotacao_id (uuid, FK → Cotacao.id)
- usuario_id (uuid, FK → Usuario.id)

- campo (string)
  - Ex.: "precos_sugeridos.Display.CPM"
- valor_anterior (text)
- valor_novo (text)
- motivo (text)

---

### 2.5. HistoricoIA

Armazena as interações importantes com a IA ligadas a uma cotação.

Campos principais:

- id (uuid)
- created_at (timestamp)

- cotacao_id (uuid, FK → Cotacao.id)

- tipo (string / enum: "plano_midia", "explicacao", "otimizacao_preco" etc.)
- prompt_enviado (text)
- resposta_ia (text)
- modelo_usado (string)

---

## 3. Relacionamentos

- Usuario 1:N Cotacao
  - Um usuário (comercial) pode ter várias cotações.

- Usuario 1:N LogAlteracoesPreco
  - Vários logs de alteração de preço podem ser atribuídos a um usuário.

- Cotacao 1:N LogAlteracoesPreco
  - Cada cotação pode ter vários registros de alteração de preço.

- Cotacao 1:N HistoricoIA
  - Cada cotação pode ter vários registros de interação com a IA.

- PrecoBase não se relaciona diretamente com Cotacao por FK, mas é utilizada nas consultas de sugestão de preço.

---

## 4. Estrutura de Campos JSON (conceitual)

### 4.1. mix_sugerido (jsonb)

Estrutura recomendada (exemplo conceitual):

- Lista de objetos, cada um representando um canal/linha do plano:
  - canal (string)
  - percentual_budget (número)
  - modelos (lista de strings)
  - formatos (lista de strings ou string única)
  - observacoes (string opcional)

### 4.2. precos_sugeridos (jsonb)

Estrutura recomendada:

- Objeto com chaves por canal:
  - Ex.: "Display", "CTV", "CRM" etc.
- Para cada canal:
  - modelos (CPM, CPC, CPV etc.) com valores numéricos
  - observacoes de pricing, se necessário.

### 4.3. estimativas (jsonb)

Estrutura recomendada:

- impressoes (número)
- alcance (número)
- cliques (número)
- leads (número)
- cpm_estimado (número)
- cpc_estimado (número)
- cpl_estimado (número)
- outros KPIs que fizerem sentido (ex.: VTR, CPA).

---

## 5. Índices Recomendados

Para performance e relatórios, recomenda-se:

- Índice em `cotacoes(cliente_segmento)`
- Índice em `cotacoes(regiao)`
- Índice em `cotacoes(created_at)`
- Índice em `cotacoes(vendedor_id)`
- Índice em `preco_base(canal, segmento, regiao, modelo_compra)`

---

## 6. Observações

- Os tipos concretos (string/enum) podem ser especificados com mais rigidez no modelo Prisma/ORM.
- Campos JSON permitem evolução futura sem migrações complexas de schema.
- Logs e histórico de IA são críticos para governança e tuning do modelo ao longo do tempo.