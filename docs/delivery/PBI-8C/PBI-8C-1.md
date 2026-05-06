# Task 8C-1: Definir fluxo operacional interno de decisão (entrada, análise, saída)

## Status
✅ Done

## Descrição
Definir o fluxo completo de decisão de cotações de performance dentro do sistema, incluindo gatilhos, transições de status e pontos de envio de e-mail.

## Objetivo
Padronizar o processo operacional para eliminar decisões fora da plataforma e garantir rastreabilidade.

## Fluxo Definido (v1)
### Entrada
- Ao enviar cotação de campanha com `PERFORMANCE`, o sistema move status para `AGUARDANDO_APROVACAO`.
- Essa entrada alimenta a fila operacional interna de performance.

### Análise
- Time operacional acessa a fila no admin e abre a cotação para decisão.
- Decisão continua humana, registrada no sistema (preço final/racional) em etapas seguintes do `8C`.

### Saída
- Após decisão interna, status esperado de saída é `APROVADA` ou `RECUSADA`.
- E-mail final ao solicitante (com cópias internas) permanece obrigatório no fechamento do fluxo (`8C-5`).

## Critérios de Aceite
- [x] Fluxo de entrada (cotação recebida) definido.
- [x] Fluxo de análise e decisão interna definido.
- [x] Fluxo de saída com envio final ao solicitante definido.
- [x] Mapa de status e transições aprovado.
