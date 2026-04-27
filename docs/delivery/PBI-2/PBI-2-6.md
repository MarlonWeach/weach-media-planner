# Task 2-6: Criar painel admin - Margens mínimas

## Status
✅ Done

## Descrição
Criar estrutura administrativa para cadastro de margens mínimas por canal, com controle de ativação e trilha de auditoria.

## Objetivo
Permitir que o time ADMIN ajuste limites mínimos de margem sem alterar código, reforçando governança comercial.

## Critérios de Aceite
- [x] Página admin acessível em `/admin/margens`.
- [x] Apenas usuários com role `ADMIN` podem acessar APIs e tela.
- [x] Listar margens mínimas por canal.
- [x] Criar nova margem mínima com validação (0% a 100%).
- [x] Editar margem mínima existente.
- [x] Ativar/Inativar margem mínima.
- [x] Registrar alterações relevantes em log de auditoria.

## Modelo de Dados Proposto
### `wp_MargemMinima`
- `id` (uuid)
- `createdAt` (datetime)
- `updatedAt` (datetime)
- `canal` (enum/string, único)
- `margemMinima` (decimal %)
- `descricao` (string, opcional)
- `origem` (string)
- `ativo` (boolean)

## APIs Propostas
- `GET /api/admin/margens`
- `POST /api/admin/margens`
- `PUT /api/admin/margens/[id]`
- `PATCH /api/admin/margens/[id]`

## UI Proposta
Página `app/admin/margens/page.tsx` com:
- formulário de criação/edição por canal;
- tabela de listagem;
- ações de editar e ativar/inativar.

## Dependências
- `2-1` Autenticação/autorização.
- `2-2` Login.
- `2-3` Padrão de painel admin.

## Arquivos Esperados
- `prisma/schema.prisma`
- `app/api/admin/margens/route.ts`
- `app/api/admin/margens/[id]/route.ts`
- `app/admin/margens/page.tsx`

## Evidências de Implementação
- Modelagem `wp_MargemMinima` criada em `prisma/schema.prisma` com unicidade por canal.
- CRUD admin implementado em `app/api/admin/margens/route.ts` e `app/api/admin/margens/[id]/route.ts`.
- Tela administrativa implementada em `app/admin/margens/page.tsx` e habilitada no menu `app/admin/page.tsx`.
- Auditoria de create/update/status integrada com `wp_LogAlteracaoPreco`.
- Validação de governança integrada para ler margem mínima real da tabela `wp_MargemMinima` em `lib/pricing/calculoPrecos.ts` (com fallback seguro).

## Checklist de Validação Funcional
- [x] Criar margem mínima para um canal e confirmar persistência após refresh.
- [x] Editar margem mínima e validar retorno na listagem.
- [x] Inativar e reativar margem mínima.
- [x] Chamar `POST /api/pricing/diagnostico` e confirmar `margensMinimasAtivas`.
- [x] Validar se cálculo/governança respeita margem ativa do canal.
