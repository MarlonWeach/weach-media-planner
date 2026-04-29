# PRD - PBI-8A: Workflow de Cotação por E-mail

## Contexto
A operação comercial atual de cotações (principalmente performance) ocorre por e-mail, com análise humana especializada e troca com solicitante e time interno.

## Objetivo
Trazer o fluxo de disparo e acompanhamento de cotações por e-mail para dentro do sistema, mantendo a decisão humana e criando rastreabilidade operacional.

## Escopo
- Disparar e-mail com resumo da cotação para:
  - responsável comercial principal,
  - lista de cópia interna,
  - solicitante da cotação.
- Suportar envio para:
  - cotações de performance (obrigatório),
  - cotações programáticas (cópia para validação, configurável).
- Padronizar template com dados do briefing (similar ao formato hoje recebido por Google Form Notifications).
- Registrar histórico do envio (destinatários, timestamp, status, erro/sucesso).
- Permitir atualização de status operacional (ex.: ENVIADA, EM_ANALISE, RESPONDIDA).

## Fora de Escopo
- Automatização de decisão de preço de performance.
- Motor preditivo de preço.

## Métricas de Sucesso
- 100% das cotações de performance com e-mail disparado e logado.
- Redução de perda de contexto entre briefing e resposta comercial.
- Melhoria na rastreabilidade de quem recebeu e quando recebeu cada cotação.
