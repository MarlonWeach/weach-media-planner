# Task 9-5: Implementar log de sincronização, retry e idempotência por cotação

## Status
✅ Done

## Descrição
Adicionar rastreabilidade da sincronização para Google Sheets com controle de tentativas, reexecução em falhas transitórias e proteção básica para evitar reenvio de cotação já sincronizada com sucesso.

## Objetivo
Dar segurança operacional para a integração da `9-4`, facilitando diagnóstico e reduzindo risco de inconsistência em cenários de falha temporária da API do Google.

## Critérios de Aceite
- [x] Existe registro persistido de sincronização por cotação.
- [x] Há retry automático em falhas transitórias.
- [x] Cotação já sincronizada com sucesso não é reenviada no fluxo normal.
- [x] Erros de sincronização ficam registrados para suporte.

## Implementação
- Atualizado `prisma/schema.prisma` com o modelo `wp_IntegracaoSheetsLog`.
- Integrado `lib/integrations/googleSheetsCotacao.ts` com:
  - log inicial em status `EM_PROCESSAMENTO`;
  - `MAX_RETRY_ATTEMPTS = 3` para tentativas de `append`;
  - atualização para `SUCESSO` com timestamp e referência da cotação;
  - atualização para `ERRO` com mensagem final;
  - idempotência: se já estiver em `SUCESSO`, a sincronização é ignorada.

## Observações
- Será necessário aplicar o schema no banco (`npm run db:push`) antes de validar em ambiente.
