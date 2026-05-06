# Task 8C-4: Disparar e-mail de notificação quando nova cotação de performance entrar na fila

## Status
✅ Done

## Descrição
Disparar e-mail operacional interno notificando a chegada de nova cotação de performance pendente de decisão.

## Objetivo
Garantir alerta imediato para análise, sem depender apenas de monitoramento manual do painel.

## Entregas
- Novo resolvedor de destinatários internos em `lib/notifications/cotacaoEmail.ts`.
- Novo envio dedicado de notificação de fila:
  - `sendPerformanceQueueNotificationEmail(...)`.
- Integração na entrada do fluxo (`POST /api/cotacao/[id]/pdf`):
  - campanhas com `PERFORMANCE` enviam notificação interna e mudam para `AGUARDANDO_APROVACAO`;
  - sem envio ao solicitante nesta etapa.

## Critérios de Aceite
- [x] Notificação enviada automaticamente ao entrar na fila.
- [x] Template com dados essenciais para triagem rápida.
- [x] Destinatários internos configuráveis conforme padrão do `8A`.
