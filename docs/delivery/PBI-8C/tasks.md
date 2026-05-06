# Tasks - PBI-8C: Operação Interna de Decisão de Performance

## Status Geral
🔄 InProgress

## Tasks

| ID | Descrição | Status | Prioridade |
|----|-----------|--------|------------|
| 8C-1 | Definir fluxo operacional interno de decisão (entrada, análise, saída) | ✅ Done | ⚠️ Alta |
| 8C-2 | Implementar fila de cotações de performance aguardando decisão | ✅ Done | ⚠️ Alta |
| 8C-3 | Implementar tela de decisão interna com racional e preço final | ✅ Done | ⚠️ Alta |
| 8C-4 | Disparar e-mail de notificação quando nova cotação de performance entrar na fila | ✅ Done | ⚠️ Alta |
| 8C-5 | Enviar e-mail final ao solicitante (com cópias internas do 8A) após resposta no sistema | ✅ Done | ⚠️ Alta |
| 8C-6 | Integrar status, auditoria e histórico ponta a ponta no painel administrativo | ✅ Done | 📌 Média |
| 8C-9 | Ajustes de UX em cotação performance, navegação e padronização final de e-mails | ✅ Done | ⚠️ Alta |
| 8C-10 | Encadear e-mails de performance na mesma thread (Message-ID / In-Reply-To) | ✅ Done | ⚠️ Alta |
| 8C-7 | Rotacionar segredos sensíveis (DB, OpenAI, SMTP, JWT) em todos os ambientes no fechamento do projeto | 📌 Pendente | ⚠️ Alta |
| 8C-8 | Ajustar UX da decisão e padronizar e-mail final de performance com briefing | ✅ Done | ⚠️ Alta |

## Ordem Recomendada
1. `8C-1` desenho de fluxo e regras
2. `8C-2` fila operacional
3. `8C-3` formulário de decisão
4. `8C-4` notificação de chegada
5. `8C-5` envio final ao solicitante
6. `8C-6` rastreabilidade e fechamento
7. `8C-8` ajustes finos de UX e comunicação final de performance
8. `8C-9` ajustes finais de UX/e-mail no fluxo de performance
9. `8C-10` encadeamento de thread de e-mail performance
10. `8C-7` rotação final de segredos (última task do projeto)

## Observações
- O envio final ao solicitante com cópias internas é obrigatório neste PBI.
- As configurações de destinatários devem reutilizar o padrão já consolidado no `8A`.
- O racional e preço final devem alimentar a base histórica criada no `8B`.
- A task `8C-7` deve ser executada apenas no fechamento final do projeto (go-live/hardening final).
