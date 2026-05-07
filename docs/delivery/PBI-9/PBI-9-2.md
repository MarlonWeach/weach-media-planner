# Task 9-2: Implementar contador sequencial transacional no banco com seed inicial do legado

## Status
✅ Done

## Descrição
Criar mecanismo de contador sequencial no banco para suportar o ID operacional legado, com controle transacional para concorrência e seed inicial baseado no último número histórico informado.

## Objetivo
Garantir geração única e crescente do número operacional, mesmo com múltiplos usuários criando cotações ao mesmo tempo.

## Critérios de Aceite
- [x] Existe serviço único para obter o próximo número sequencial.
- [x] O incremento é protegido contra concorrência transacional.
- [x] O seed inicial é aplicado na primeira execução a partir de configuração externa.
- [x] O estado do contador é persistido em banco.

## Implementação
- Criado `lib/cotacao/sequencial.ts` com a função `obterProximoNumeroSequencialCotacao()`.
- O contador é persistido em `wp_Configuracao` usando a chave `COTACAO_SEQUENCIAL_CONTADOR`.
- A função usa `pg_advisory_xact_lock` dentro de transação para impedir colisão sob concorrência.
- O valor inicial (`seed`) é lido da env `COTACAO_SEQUENCIAL_SEED` na primeira inicialização do contador.

## Observações
- Esta task entrega apenas a infraestrutura do contador.
- A adoção do contador no fluxo de criação de cotação (uso efetivo no ID operacional) será feita na task `9-3`.
