# Tasks - PBI-1: MVP Funcional

## Status Geral
✅ Concluído

## Tasks

| ID | Descrição | Status | Prioridade |
|----|-----------|--------|------------|
| 1-1 | Criar endpoint GET /api/cotacao/{id} | ✅ Done | 🚨 Crítica |
| 1-2 | Implementar wizard de cotação - Passo 1 (Dados do Cliente) | ✅ Done | 🚨 Crítica |
| 1-3 | Implementar wizard de cotação - Passo 2 (Objetivo e Maturidade) | ✅ Done | 🚨 Crítica |
| 1-4 | Implementar wizard de cotação - Passo 3 (Budget, Período e Região) | ✅ Done | 🚨 Crítica |
| 1-5 | Implementar wizard de cotação - Passo 4 (Resultado e Ajustes) | ✅ Done | 🚨 Crítica |
| 1-6 | Criar componente de tabela de preços dinâmica | ✅ Done | 🚨 Crítica |
| 1-7 | Implementar validações visuais de governança | ✅ Done | ⚠️ Alta |
| 1-8 | Criar dashboard inicial com listagem de cotações | ✅ Done | ⚠️ Alta |
| 1-9 | Implementar geração de PDF com branding Weach | ✅ Done | 🚨 Crítica |
| 1-10 | Criar agente IA Validator | ✅ Done | 📌 Média |
| 1-11 | Implementar salvamento de rascunho | ✅ Done | 📌 Média |
| 1-12 | Adicionar estimativas calculadas na tela | ✅ Done | ⚠️ Alta |
| 1-13 | Criar tabelas de solicitantes e agências | ✅ Done | ⚠️ Alta |
| 1-14 | Corrigir validação de agência opcional no wizard de cotação | ✅ Done | ⚠️ Alta |
| 1-15 | Revisar resultado do plano entregue (passo final) | ✅ Done | ⚠️ Alta |
| 1-16 | Tornar distribuição de budget por formato guiada por IA | ✅ Done | ⚠️ Alta |
| 1-17 | Ajustar layout responsivo da página de resultado da cotação | ✅ Done | 📌 Média |
| 1-18 | Implementar controle de preço e % budget no plano de mídia | ✅ Done | ⚠️ Alta |

## Ordem de Execução Recomendada

1. **1-1** - Endpoint GET cotação (base para outras tasks)
2. **1-2, 1-3, 1-4, 1-5** - Wizard completo (sequencial)
3. **1-6** - Tabela de preços (necessária para passo 4)
4. **1-7** - Validações (integra com tabela)
5. **1-9** - Geração de PDF (depende do wizard completo)
6. **1-8** - Dashboard (pode ser paralelo)
7. **1-10, 1-11, 1-12** - Melhorias e refinamentos
8. **1-13** - Estrutura de dados para listas dinâmicas

## Observações
- Tasks marcadas como 🚨 Crítica são bloqueadoras
- Wizard deve ser implementado sequencialmente
- PDF depende de todos os dados do wizard

