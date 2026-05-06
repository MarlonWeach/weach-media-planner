# Task 8C-10: Encadear e-mails de performance na mesma thread (Message-ID / In-Reply-To)

## Status
✅ Done

## Descrição
Implementar encadeamento técnico dos e-mails do fluxo de performance para que o envio de resposta final seja associado à notificação inicial na mesma thread.

## Objetivo
Garantir agrupamento confiável das mensagens em clientes de e-mail (Gmail e similares), reduzindo dependência de heurística de assunto.

## Critérios de Aceite
- [x] `messageId` do e-mail inicial de fila (`AGUARDANDO_APROVACAO`) é capturado no envio.
- [x] `messageId` é persistido na cotação para reutilização futura.
- [x] E-mail final de resposta usa headers `In-Reply-To` e `References` com o `messageId` persistido.
- [x] Fluxo mantém compatibilidade com fallback de assunto existente.

## Implementação
- `lib/notifications/cotacaoEmail.ts`
  - `sendPerformanceQueueNotificationEmail` passou a retornar `{ messageId }`.
  - `sendPerformanceFinalDecisionEmail` passou a aceitar `replyToMessageId` e enviar `inReplyTo`/`references`.
- `app/api/cotacao/[id]/pdf/route.ts`
  - Após notificação inicial de performance, o `messageId` retornado é persistido no JSON `observacoes` em `workflowPerformance.queueEmailMessageId`.
- `app/api/admin/performance-fila/decisao/route.ts`
  - Na decisão final, o endpoint lê `workflowPerformance.queueEmailMessageId` e repassa para o envio final para encadear a thread.
