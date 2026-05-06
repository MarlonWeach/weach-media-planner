# Task 8B-1: Mapear variáveis-chave para estruturação do histórico de performance

## Status
✅ Done

## Descrição
Mapear e padronizar as variáveis essenciais que devem ser capturadas em cada cotação de performance para formar uma base histórica confiável para uso futuro por IA assistiva.

## Contexto de Negócio
Atualmente, parte relevante do racional de precificação fica distribuída em texto livre e conhecimento tácito da operação. Sem um conjunto mínimo de variáveis estruturadas, a base histórica perde qualidade analítica e utilidade para aprendizado futuro.

## Objetivo
Definir um mapa de variáveis obrigatórias e recomendadas para histórico de performance, com nomenclatura padronizada e critérios mínimos de preenchimento.

## Mapa de Variáveis (v1)

### 1) Identificação da cotação
- `cotacaoId` (UUID interno)
- `createdAt` (timestamp de criação)
- `updatedAt` (timestamp da última alteração)
- `statusCotacao` (rascunho, enviada, aprovada, recusada, etc.)

### 2) Contexto comercial
- `clienteNome`
- `clienteSegmento`
- `solicitanteId` / `solicitanteNome`
- `agenciaId` / `agenciaNome`
- `vendedorId`

### 3) Briefing de performance
- `objetivoCampanha` (ex.: leads, vendas, awareness)
- `budgetTotal`
- `periodoInicio` / `periodoFim`
- `regiaoTipo` (nacional, estado, cidades, etc.)
- `regiaoDetalhe` (texto normalizado para exibição)
- `maturidadeDigital`
- `toleranciaRisco`

### 4) Estratégia de mídia e compra
- `definicaoCampanha` (performance/programática/híbrida)
- `canaisSelecionados`
- `formatosSelecionados`
- `modelosCompraSelecionados` (CPC, CPL, CPM, CPV etc.)
- `mixSugerido` (estrutura JSON já existente)

### 5) Precificação e estimativas
- `precoTabela` (valor calculado base)
- `precoFinalAplicado` (valor final humano)
- `desvioPercentualTabelaVsFinal`
- `estimativasResultado` (impressões, cliques, leads, CTR, CVR)

### 6) Racional humano e decisão
- `racionalTexto` (justificativa comercial/estratégica)
- `racionalTags` (lista curta padronizada)
- `motivoAjustePreco` (quando preço final divergir da sugestão)
- `origemDecisao` (manual, revisão, exceção)

### 7) Auditoria operacional
- `autorUltimaAlteracaoId`
- `origemAlteracao` (sistema, usuário, reenvio, ajuste)
- `versaoRegistro`

## Critérios de Qualidade de Dados
- Variáveis críticas devem existir para toda cotação em status `ENVIADA` ou superior.
- Campos textuais estratégicos devem permitir normalização posterior (tags + texto livre).
- Estruturas JSON devem manter formato estável para consulta e export.

## Critérios de Aceite
- [x] Lista de variáveis-chave definida e documentada.
- [x] Separação entre variáveis obrigatórias e recomendadas definida.
- [x] Regras mínimas de preenchimento por etapa da cotação definidas.
- [x] Insumos prontos para `8B-2` (modelagem de dados).

## Artefatos de Saída desta Task
- Documento base de variáveis do histórico de performance.
- Matriz de uso por etapa do fluxo (briefing, pricing, aprovação).
- Insumo para modelagem no `8B-2`.

## Dependências
- Nenhuma (task de definição).

## Próximas Tasks Relacionadas
- `8B-2`: Definir modelo de dados para briefing, racional e preço final.
- `8B-3`: Implementar persistência de racional humano por cotação/formato.
- `8B-4`: Implementar trilha de alterações de racional e preço.
