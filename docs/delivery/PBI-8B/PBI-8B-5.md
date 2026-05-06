# Task 8B-5: Criar tela operacional para manutenção e revisão do histórico

## Status
✅ Done

## Descrição
Disponibilizar interface administrativa para revisão e manutenção de racional/preço final por registro de performance.

## Entregas
- Página `app/admin/performance-historico/page.tsx` com:
  - listagem paginada de registros;
  - filtro por cotação/cliente;
  - edição de preço final, racional, tags, motivo e origem da decisão;
  - salvamento via API administrativa.
- Inclusão no menu `app/admin/page.tsx`:
  - item **Base Histórica IA (Performance)**.

## Critérios de Aceite
- [x] Tela administrativa acessível para ADMIN.
- [x] Edição operacional de racional e preço final disponível.
- [x] Fluxo de atualização integrado com persistência e auditoria.

