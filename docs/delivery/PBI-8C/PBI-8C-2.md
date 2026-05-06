# Task 8C-2: Implementar fila de cotações de performance aguardando decisão

## Status
✅ Done

## Descrição
Criar listagem operacional no admin para concentrar cotações de performance pendentes de decisão.

## Objetivo
Dar visibilidade e priorização para a operação responder dentro do sistema.

## Entregas
- API dedicada `GET /api/admin/performance-fila` para listar cotações em `AGUARDANDO_APROVACAO` com `PERFORMANCE`.
- Página `app/admin/performance-fila/page.tsx` com:
  - busca por ID/cliente;
  - paginação;
  - card operacional com principais dados da cotação;
  - ação direta para abrir cotação na tela de edição/decisão.
- Atalho no menu admin para a fila de performance.

## Critérios de Aceite
- [x] Fila acessível para perfis autorizados.
- [x] Filtros mínimos por status, data e solicitante.
- [x] Link direto para tela de decisão da cotação.
