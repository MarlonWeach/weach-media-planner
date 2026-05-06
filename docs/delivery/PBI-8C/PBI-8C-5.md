# Task 8C-5: Enviar e-mail final ao solicitante (com cópias internas do 8A) após resposta no sistema

## Status
✅ Done

## Descrição
Após decisão registrada no sistema, enviar resposta final por e-mail ao solicitante, mantendo cópias internas conforme regras do `8A`.

## Objetivo
Fechar o ciclo operacional dentro da plataforma, preservando comunicação externa por e-mail.

## Critérios de Aceite
- [x] E-mail final enviado ao solicitante após decisão interna.
- [x] Cópias internas (CC) aplicadas conforme configuração do `8A`.
- [x] Conteúdo do e-mail refletindo decisão registrada no sistema.

## Implementação
- Criado endpoint `POST /api/admin/performance-fila/decisao` para finalizar decisão (`APROVADA`/`RECUSADA`) apenas para `ADMIN`.
- O endpoint valida a cotação em `AGUARDANDO_APROVACAO`, confirma que o fluxo é de performance e dispara o e-mail final ao solicitante com CC interno.
- A finalização grava trilha de auditoria em `wp_LogAlteracaoPreco` (`campo: PERFORMANCE_DECISAO_FINAL`) e atualiza o status da cotação.
- A tela `app/admin/performance-fila/[id]/page.tsx` passou a ter ações explícitas de fechamento: `Aprovar e Enviar` e `Recusar e Enviar`, com comentário opcional no e-mail final.
