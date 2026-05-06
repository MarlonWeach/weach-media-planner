# Task 8C-9: Ajustes de UX em cotação performance, navegação e padronização final de e-mails

## Status
✅ Done

## Descrição
Consolidar ajustes finais no fluxo de performance para evitar exposição de plano sem base validada, melhorar navegação e padronizar conteúdos de e-mails.

## Objetivo
Garantir clareza para o usuário no envio de cotação de performance, manter consistência de comunicação e facilitar acesso ao fluxo de resposta operacional.

## Escopo
- `/cotacao/nova` (step final quando campanha inclui `PERFORMANCE`)
- `/cotacao/[id]/editar`
- `/dashboard` (ações para cotações `AGUARDANDO_APROVACAO`)
- E-mails de notificação de fila e e-mails de resposta final de cotação

## Critérios de Aceite
- [x] Quando a cotação for de `PERFORMANCE`, no último step (`Resultado e Ajustes`) o plano/tabela/estimativas não deve ser exibido; deve aparecer somente a mensagem: `Clique em Enviar Cotação para receber o plano de mídia.`
- [x] Após clicar em `Enviar cotação` no fluxo de performance, deve existir feedback visual explícito de sucesso (toast/alerta/mensagem persistente) confirmando envio para fila.
- [x] E-mail de entrada na fila de performance deve conter perguntas e respostas completas do briefing (incluindo campos como `O cliente está veiculando em outras redes?` e resposta correspondente).
- [x] Assunto do e-mail de entrada na fila deve seguir o padrão: `Cotação - <nome cliente> (<id>)` (sem prefixo `[Fila Performance]`).
- [x] Em `/cotacao/nova` deve existir botão/menu para retornar para home.
- [x] Em `/cotacao/[id]/editar` deve existir botão/menu para retornar para home.
- [x] Em `/dashboard`, cotações com status `AGUARDANDO_APROVACAO` devem exibir botão `Responder` direcionando para `/admin/performance-fila/[id]`.
- [x] No e-mail final de resposta da cotação, o campo `Preço final` deve incluir sufixo do modelo de performance (ex.: `CPI R$ 4,00`).

## Observações de Implementação
- A ocultação do plano no step final de performance é temporária até a base histórica/ML estar operacional.
- O conteúdo do briefing no e-mail deve preservar o preenchimento original do formulário, sem perda de campos opcionais ou condicionais.
- Manter o padrão visual e de copy dos fluxos já aprovados no PBI-8C.

## Implementação
- `components/cotacao/WizardStep4.tsx`
  - Oculta tabela/estimativas/ajustes quando a definição da campanha inclui `PERFORMANCE`.
  - Exibe mensagem orientativa no step final para envio.
  - Permite envio sem bloqueio de distribuição e exibe feedback de sucesso após envio.
- `app/cotacao/nova/page.tsx` e `app/cotacao/[id]/editar/page.tsx`
  - Adicionado botão `Ir para Home` no cabeçalho.
- `components/dashboard/CotacaoCard.tsx`
  - Adicionado botão `Responder` para cotações `AGUARDANDO_APROVACAO`, direcionando para a tela de decisão interna.
- `lib/notifications/cotacaoEmail.ts`
  - E-mail de entrada na fila de performance com assunto `Cotação - <cliente> (<id>)`.
  - Inclusão de bloco de briefing completo no e-mail (texto e HTML), incluindo campos condicionais de performance.
  - No e-mail final de resposta, `Preço final` passa a incluir sufixo do modelo (`CPI`, `CPL`, etc.) quando disponível.
