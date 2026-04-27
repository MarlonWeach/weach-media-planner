# Task 2-8: Implementar auditoria de alterações

## Status
🔄 InReview

## Descrição
Consolidar auditoria de alterações de configurações de preço (regras, margens, pisos/tetos), com padrão único de registro.

## Objetivo
Garantir rastreabilidade de mudanças críticas de pricing para governança e compliance interno.

## Critérios de Aceite
- [x] Todas as rotas admin de preço registram alteração com antes/depois.
- [x] Registro contém usuário, data e motivo/campo.
- [x] Estrutura de log padronizada para facilitar consulta.

## Evidências de Implementação
- Helper central criado em `lib/pricing/auditoriaPreco.ts` com:
  - `obterOuCriarCotacaoSistema` (cotação técnica padrão para auditoria)
  - `registrarLogAlteracaoPreco` (payload padronizado de log)
- Rotas refatoradas para usar o helper e padronizar o formato de auditoria:
  - `app/api/admin/regras-preco/route.ts`
  - `app/api/admin/regras-preco/[id]/route.ts`
  - `app/api/admin/margens/route.ts`
  - `app/api/admin/margens/[id]/route.ts`
  - `app/api/admin/pisos-tetos/route.ts`
  - `app/api/admin/pisos-tetos/[id]/route.ts`
  - `app/api/admin/cpm-base/route.ts`

## Dependências
- `2-4`, `2-6`, `2-7`.
