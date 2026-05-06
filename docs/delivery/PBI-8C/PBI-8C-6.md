# Task 8C-6: Integrar status, auditoria e histórico ponta a ponta no painel administrativo

## Status
✅ Done

## Descrição
Consolidar no painel os status operacionais, trilha de auditoria e histórico de decisão do fluxo interno de performance.

## Objetivo
Garantir governança e rastreabilidade completa do processo, da entrada até o envio final.

## Critérios de Aceite
- [x] Status de workflow visível e consistente.
- [x] Logs de alteração vinculados à decisão.
- [x] Histórico de decisão consultável por cotação.

## Implementação
- A tela `app/admin/performance-fila/[id]/page.tsx` passou a consolidar três visões da cotação: status atual do workflow, itens do histórico de decisão e trilha de auditoria relacionada ao fluxo de performance.
- A API `POST /api/cotacao/[id]/pdf` agora registra log de workflow (`PERFORMANCE_STATUS_WORKFLOW`) ao mover status para `AGUARDANDO_APROVACAO` (performance) ou `ENVIADA` (demais fluxos), garantindo rastreabilidade desde a entrada.
- O endpoint de auditoria `GET /api/admin/logs` passou a aceitar filtro por `cotacaoId`, facilitando consultas direcionadas por cotação no painel administrativo.
- A finalização de decisão (`APROVADA`/`RECUSADA`) já registrada no `8C-5` fecha o ciclo com log `PERFORMANCE_DECISAO_FINAL`, complementando os logs de racional e preço final do histórico.
