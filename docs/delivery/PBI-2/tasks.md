# Tasks - PBI-2: Admin e Regras de Preço

## Status Geral
✅ Done

## Tasks

| ID | Descrição | Status | Prioridade |
|----|-----------|--------|------------|
| 2-1 | Implementar autenticação e autorização | ✅ Done | 🚨 Crítica |
| 2-2 | Criar tela de login | ✅ Done | 🚨 Crítica |
| 2-3 | Criar painel admin - Edição CPM base | ✅ Done | 🚨 Crítica |
| 2-4 | Criar painel admin - Regras de preço unificadas | ✅ Done | ⚠️ Alta |
| 2-5 | Criar painel admin - Tabelas condicionais (absorvida pela 2-4) | ✅ Done | ⚠️ Alta |
| 2-6 | Criar painel admin - Margens mínimas | ✅ Done | ⚠️ Alta |
| 2-7 | Criar painel admin - Pisos e tetos | ✅ Done | ⚠️ Alta |
| 2-8 | Implementar auditoria de alterações | ✅ Done | ⚠️ Alta |
| 2-9 | Criar visualização de logs | ✅ Done | 📌 Média |
| 2-10 | Corrigir aplicação de regionalização (Nacional x Estado x Cidade) na precificação | ✅ Done | 🚨 Crítica |
| 2-11 | Validar reconhecimento de cidades e alertar correção quando não identificada | ✅ Done | ⚠️ Alta |
| 2-12 | Implementar gestão de usuários de acesso integrada ao cadastro base (roles: ADMIN, MANAGER, COMERCIAL) | ✅ Done | 🚨 Crítica |

## Ordem de Execução Recomendada

1. **2-1, 2-2** - Autenticação (bloqueador)
2. **2-3** - CPM base (mais crítico)
3. **2-4** - Tabelas de preço (fixas + condicionais unificadas)
4. **2-6, 2-7** - Regras de governança
5. **2-8, 2-9** - Auditoria
6. **2-10** - Correção de regionalização em produção
7. **2-11** - Validação assistida de cidade (não reconhecida)
8. **2-12** - Provisionamento e gestão de usuários (acesso)

## Observações
- A task `2-5` foi absorvida pela `2-4`, pois o painel unificado em `/admin/regras-preco` já contempla regras fixas e condicionais no mesmo fluxo de cadastro/edição.

