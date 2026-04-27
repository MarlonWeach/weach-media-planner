# Task 2-4: Criar painel admin - Valores fixos

## Status
✅ Done

## Descrição
Criar estrutura de dados e interface administrativa unificada para cadastro e gestão de regras de pricing (valores fixos + condicionais) por canal/formato/modelo de compra.

## Objetivo
Permitir que o time ADMIN mantenha regras de preço sem editar código, consolidando fixos e condicionais em uma tela única para facilitar governança.

## Critérios de Aceite
- [x] Página admin acessível em `/admin/regras-preco`.
- [x] Apenas usuários com role `ADMIN` podem acessar APIs e tela.
- [x] Listar regras cadastradas com filtros básicos (tipo, canal, ativo).
- [x] Criar nova regra com validações.
- [x] Editar regra existente.
- [x] Ativar/Inativar regra.
- [x] Registrar alterações relevantes em log de auditoria.
- [x] Integrar leitura dos valores fixos no motor de pricing (camada de consulta).

## Modelo de Dados Proposto (Prisma)

### `wp_ValorFixoPreco`
- `id` (uuid)
- `createdAt` (datetime)
- `updatedAt` (datetime)
- `canal` (enum/string)
- `formato` (string, opcional)
- `modeloCompra` (enum/string)
- `nomeRegra` (string, opcional)
- `valor` (decimal)
- `unidade` (string, ex: CPM/CPC/CPV/CPCL/CPD)
- `origem` (string, ex: PLANILHA, MANUAL)
- `ativo` (boolean)
- `ordem` (int, opcional)

Índices recomendados:
- `@@index([canal])`
- `@@index([modeloCompra])`
- `@@index([ativo])`

## APIs Propostas
- `GET /api/admin/regras-preco`
  - lista regras com filtros e ordenação e garante carga inicial da planilha quando vazio.
- `POST /api/admin/regras-preco`
  - cria nova regra.
- `PUT /api/admin/regras-preco/[id]`
  - atualiza regra.
- `PATCH /api/admin/regras-preco/[id]`
  - ativa/inativa registro.

## UI Proposta
Página `app/admin/regras-preco/page.tsx` com:
- formulário de criação/edição;
- tabela de listagem unificada (fixo + condicional);
- ações de editar e ativar/inativar;
- mensagens de sucesso/erro.

## Mapeamento Inicial (Excel -> Valores Fixos)
Referência detalhada em:
- `docs/delivery/PBI-2/2-4-pricing-rules-reference.md`

Aplicação:
- itens puramente fixos entram nesta task (`2-4`);
- itens com fórmula/condição foram absorvidos nesta task (`2-4`), consolidando o escopo da antiga `2-5`.

## Dependências
- `2-1` Autenticação/autorização.
- `2-2` Login.
- `2-3` Padrão de painel admin.

## Arquivos Esperados
- `prisma/schema.prisma` (evolução do model de regras)
- `app/api/admin/regras-preco/route.ts`
- `app/api/admin/regras-preco/[id]/route.ts`
- `app/admin/regras-preco/page.tsx`
- `lib/pricing/calculoPrecos.ts` (camada de consulta das regras)

## Evidências de Implementação
- Rotas legadas removidas: `app/api/admin/valores-fixos/*` e `app/admin/valores-fixos/page.tsx`.
- Seed consolidado da planilha em `app/api/admin/regras-preco/route.ts`.
- Integração do motor com regras ativas do banco em `lib/pricing/calculoPrecos.ts`.
- Endpoint de homologação criado em `app/api/pricing/diagnostico/route.ts`.
- A task `2-5` (tabelas condicionais) foi absorvida pela implementação unificada da `2-4`.

## Estimativa
8 horas
