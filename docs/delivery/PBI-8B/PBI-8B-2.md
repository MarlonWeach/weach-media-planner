# Task 8B-2: Definir modelo de dados para briefing, racional e preço final

## Status
✅ Done

## Descrição
Definir e aplicar o modelo de dados para histórico de performance, consolidando briefing contextual, preço de referência, preço final aplicado e racional humano por formato.

## Decisão Técnica
- Manter o histórico no campo `observacoes` da `wp_Cotacao`, em chave dedicada `historicoPerformance`.
- Estrutura versionada (`versao`) com metadados de atualização e lista de registros por combinação `canal+formato+modeloCompra`.
- Preservar compatibilidade com payload já existente em `observacoes` (sem quebrar fluxo atual de e-mail/PDF).

## Estrutura Aplicada (v1)
- `historicoPerformance.versao`
- `historicoPerformance.atualizadoEm`
- `historicoPerformance.atualizadoPor`
- `historicoPerformance.registros[]` com:
  - `canal`
  - `formato`
  - `modeloCompra`
  - `precoTabela`
  - `precoFinalAplicado`
  - `racionalTexto`
  - `racionalTags[]`
  - `motivoAjustePreco`
  - `origemDecisao`
  - `atualizadoEm`
  - `atualizadoPor`

## Critérios de Aceite
- [x] Modelo de dados definido e documentado.
- [x] Versionamento e autoria previstos.
- [x] Compatibilidade com `observacoes` existente mantida.
- [x] Estrutura pronta para persistência e relatório (`8B-3` a `8B-6`).

