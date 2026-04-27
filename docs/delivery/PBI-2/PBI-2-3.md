# Task 2-3: Criar painel admin - Edição CPM base

## Status
✅ Done

## Descrição
Criar interface administrativa para editar o CPM base programático (D3), que é o valor central que determina todos os preços do sistema.

## Critérios de Aceite
- [x] Página admin acessível em `/admin/cpm-base`
- [x] Apenas usuários com role ADMIN podem acessar
- [x] Exibe valor atual do CPM base
- [x] Permite editar o valor
- [x] Validação de valor (deve ser > 0)
- [x] Salva alteração em `wp_Configuracao`
- [x] Registra alteração em `wp_LogAlteracaoPreco` (auditoria)
- [x] Exibe histórico de alterações
- [x] Confirmação antes de salvar
- [x] Feedback visual de sucesso/erro

## Arquivos a Criar/Modificar
- `app/admin/cpm-base/page.tsx` (criar)
- `app/api/admin/cpm-base/route.ts` (criar)
- `components/admin/CpmBaseEditor.tsx` (criar - opcional)
- `lib/utils/config.ts` (modificar - adicionar função de atualização)

## Dependências
- Task 2-1 (Autenticação)
- Task 2-2 (Login)
- Model `wp_Configuracao` (já existe)
- Model `wp_LogAlteracaoPreco` (já existe)

## Estimativa
4 horas

## Referências
- `docs/06-tabelas-de-preco-base.md` - Seção 1
- `lib/utils/config.ts` - função `obterCpmBase()`
- `prisma/schema.prisma` - models `wp_Configuracao` e `wp_LogAlteracaoPreco`

## Notas Técnicas
- CPM base é armazenado em `wp_Configuracao` com chave `CPM_BASE_PROGRAMATICO`
- Valor deve ser JSON: `{ "valor": 4.0 }`
- Toda alteração deve ser registrada em `wp_LogAlteracaoPreco`
- Alterar CPM base afeta todos os cálculos de precificação

