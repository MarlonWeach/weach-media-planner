# Task 1-1: Criar endpoint GET /api/cotacao/{id}

## Status
✅ Done

## Descrição
Implementar endpoint para buscar uma cotação específica pelo ID, retornando todos os dados da cotação incluindo mix, preços, estimativas e histórico.

## Critérios de Aceite
- [x] Endpoint GET /api/cotacao/{id} retorna dados completos da cotação
- [x] Retorna 404 se cotação não existir
- [x] Retorna 403 se usuário não tiver permissão
- [x] Inclui mix sugerido, preços sugeridos e estimativas
- [x] Inclui dados do vendedor
- [x] Validação de autenticação implementada (básica, será melhorada na Task 2-1)

## Arquivos a Modificar
- `app/api/cotacao/[id]/route.ts` (criar)

## Dependências
- Nenhuma

## Estimativa
2 horas

## Notas Técnicas
- Usar Prisma para buscar cotação
- Validar permissões do usuário
- Retornar dados em formato JSON estruturado

