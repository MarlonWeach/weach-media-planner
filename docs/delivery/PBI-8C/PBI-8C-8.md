# Task 8C-8: Ajustar UX da decisão e padronizar e-mail final de performance com briefing

## Status
✅ Done

## Descrição
Ajustar a experiência da tela de decisão interna de performance e padronizar o e-mail de resposta final ao solicitante no mesmo padrão operacional esperado pelo time.

## Objetivo
Reduzir ambiguidades no fluxo de decisão e garantir comunicação final consistente para o solicitante.

## Critérios de Aceite
- [x] Campo de motivo do ajuste removido da tela, mantendo racional como fonte principal.
- [x] Opções de origem de decisão ajustadas para refletir somente cenários úteis ao processo.
- [x] Ação intermediária de "Salvar decisão" removida, mantendo apenas fechamento com envio.
- [x] E-mail final de performance padronizado com assunto no formato acordado e seção de briefing preenchido.

## Implementação
- A página `app/admin/performance-fila/[id]/page.tsx` foi simplificada:
  - removido campo de motivo de ajuste;
  - removida opção `MANUAL` (mantidas `REVISAO` e `EXCECAO`);
  - removido botão `Salvar decisão`;
  - campo de tags recebeu exemplos e orientação de uso para classificação histórica.
- A função `sendPerformanceFinalDecisionEmail` em `lib/notifications/cotacaoEmail.ts` foi reformulada para:
  - assunto: `Resposta Cotação - <cliente> - <agencia> - <id>`;
  - destacar preço final no início, seguido de observação opcional;
  - incluir seção delimitada com os dados preenchidos no briefing.
- O endpoint `app/api/admin/performance-fila/decisao/route.ts` passou a enviar `agenciaNome` e `observacoes` para compor o e-mail final.
