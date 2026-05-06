# Task 8C-3: Implementar tela de decisão interna com racional e preço final

## Status
✅ Done

## Descrição
Implementar a interface para registrar decisão de performance na própria plataforma, por formato/item.

## Objetivo
Centralizar a resposta operacional e alimentar o histórico estruturado sem retrabalho.

## Entregas
- Página de decisão por cotação: `app/admin/performance-fila/[id]/page.tsx`
  - edição de preço final por item/formato;
  - racional, tags, motivo e origem da decisão;
  - validações mínimas de preenchimento antes de salvar.
- Integração de persistência:
  - `POST /api/admin/performance-historico` para gravação por item.
- Ajuste da fila:
  - botão "Abrir para decisão" aponta para a tela dedicada de decisão.

## Critérios de Aceite
- [x] Formulário com preço final, racional, tags e motivo.
- [x] Validações mínimas de preenchimento aplicadas.
- [x] Persistência integrada à base histórica do `8B`.
