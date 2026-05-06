# PRD - PBI-8C: Operação Interna de Decisão de Performance

## Contexto
Após estruturar o disparo operacional por e-mail (`8A`) e a base histórica (`8B`), ainda existe uma lacuna operacional: a resposta final de performance continua acontecendo fora do sistema.

## Problema
Sem uma etapa interna de decisão:
- o racional final pode não ser registrado no mesmo momento da resposta;
- existe risco de inconsistência entre e-mail enviado e histórico salvo;
- a operação depende de alternância entre e-mail e sistema.

## Objetivo
Internalizar o fluxo de decisão de performance no sistema, mantendo e-mails como canal de notificação e comunicação final:

1. Notificar por e-mail quando nova cotação de performance chegar para análise.
2. Permitir que a resposta operacional seja feita dentro do sistema.
3. Enviar a resposta final por e-mail ao solicitante, com cópias internas conforme padrão do `8A`.

## Escopo
- Fila/lista de cotações de performance pendentes de decisão no admin.
- Detalhe operacional da cotação com formulário de decisão:
  - preço final por item/formato;
  - racional humano;
  - tags e motivo de ajuste.
- Mudança de status operacional da cotação:
  - `AGUARDANDO_APROVACAO` (entrada na fila),
  - `APROVADA`/`RECUSADA` (saída após decisão).
- Notificação de chegada por e-mail para operação.
- Envio de e-mail final ao solicitante após decisão, com cópias internas.

## Fora de Escopo
- Automação total de aprovação sem intervenção humana.
- Parser automático de resposta de e-mail.
- Treinamento/serving de modelo preditivo em produção.

## Regras de Negócio
- Toda cotação com definição de campanha contendo `PERFORMANCE` deve entrar na fila interna.
- O envio final ao solicitante só ocorre após decisão registrada no sistema.
- O template de saída deve manter destinatários e cópias internas definidos no `8A`.
- Toda decisão deve gerar trilha de auditoria.

## Métricas de Sucesso
- 100% das cotações de performance respondidas pelo fluxo interno.
- 100% das respostas finais enviadas ao solicitante com cópia interna.
- Redução de retrabalho por divergência entre decisão e histórico.
