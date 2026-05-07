# Task 9-3: Substituir geração de ID atual para usar o novo sequenciador em todas as entradas de cotação

## Status
✅ Done

## Descrição
Acoplar o sequenciador transacional criado na `9-2` aos fluxos de entrada de cotação para que toda nova cotação passe a receber também o número operacional sequencial legado.

## Objetivo
Garantir que a criação de cotação já nasça com identificação operacional sequencial, mantendo o UUID técnico para rotas e integridade interna.

## Critérios de Aceite
- [x] Modelo de cotação suporta campo para número sequencial operacional.
- [x] Endpoint `POST /api/cotacao/criar` atribui número sequencial na criação.
- [x] Endpoint `POST /api/cotacao/rascunho` (quando cria novo rascunho) atribui número sequencial.
- [x] Resposta dos endpoints retorna o `numeroSequencial` para uso de UI e integrações.

## Implementação
- Atualizado `prisma/schema.prisma`:
  - novo campo `numeroSequencial Int? @unique` em `wp_Cotacao`;
  - índice adicional em `numeroSequencial`.
- Atualizado `app/api/cotacao/criar/route.ts`:
  - chamada de `obterProximoNumeroSequencialCotacao()` antes do `create`;
  - persistência de `numeroSequencial` na nova cotação.
- Atualizado `app/api/cotacao/rascunho/route.ts`:
  - criação de novo rascunho também usa `obterProximoNumeroSequencialCotacao()`;
  - retorno inclui `numeroSequencial`.

## Observações
- O UUID da cotação permanece como identificador técnico para rotas internas existentes.
- Após essa task, o próximo passo é usar `numeroSequencial` nos pontos de comunicação (UI/e-mails/sync) conforme tasks seguintes do PBI-9.
