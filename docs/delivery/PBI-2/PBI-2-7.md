# Task 2-7: Criar painel admin - Pisos e tetos

## Status
✅ Done

## Descrição
Criar gestão administrativa de pisos e tetos de preço para reforçar limites operacionais de precificação.

## Objetivo
Permitir configuração de limites mínimos e máximos por combinação de canal/modelo/contexto sem alteração de código.

## Critérios de Aceite
- [x] Tela admin de pisos e tetos disponível para `ADMIN`.
- [x] CRUD com validações de consistência (piso <= teto).
- [x] Ativar/Inativar regras.
- [x] Auditoria de alterações.

## Evidências de Implementação
- Página implementada em `app/admin/pisos-tetos/page.tsx`.
- APIs implementadas em `app/api/admin/pisos-tetos/route.ts` e `app/api/admin/pisos-tetos/[id]/route.ts`.
- Validação de consistência aplicada via Zod (`precoMin <= precoAlvo <= precoMax`).
- Auditoria registrada em `wp_LogAlteracaoPreco` para create/update/status.
- Seed incremental implementado para popular `wp_PrecoBase` com:
  - baseline inicial por canal e
  - backfill por regras ativas de `wp_ValorFixoPreco` para `VAREJO/NACIONAL`.

## Dependências
- `2-6` Margens mínimas.
- `2-8` Auditoria (integração final).

## Checklist de Validação Funcional
- [x] Acessar `/admin/pisos-tetos` com usuário ADMIN e confirmar listagem.
- [x] Criar regra válida (`precoMin <= precoAlvo <= precoMax`) e confirmar persistência.
- [x] Tentar criar/editar regra inválida (`precoMin > precoAlvo` ou `precoAlvo > precoMax`) e validar bloqueio.
- [x] Editar regra existente e confirmar atualização na tabela.
- [x] Inativar e reativar regra e confirmar status.
- [x] Confirmar criação de log de auditoria para create/update/status.
