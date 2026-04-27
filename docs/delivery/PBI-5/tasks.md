# Tasks - PBI-5: Sincronização Supabase -> Google Sheets

## Status Geral
📌 Pendente

## Tasks

| ID | Descrição | Status | Prioridade |
|----|-----------|--------|------------|
| 5-1 | Definir schema de exportação (colunas e mapeamento) | 📌 Pendente | 🚨 Crítica |
| 5-2 | Configurar autenticação Google Sheets API | 📌 Pendente | 🚨 Crítica |
| 5-3 | Implementar serviço de upsert de cotações na planilha | 📌 Pendente | 🚨 Crítica |
| 5-4 | Implementar gatilho de sincronização (cron ou evento) | 📌 Pendente | ⚠️ Alta |
| 5-5 | Implementar logs e tratamento de falhas | 📌 Pendente | ⚠️ Alta |
| 5-6 | Criar rotina de reprocessamento manual | 📌 Pendente | 📌 Média |
| 5-7 | Documentar operação e troubleshooting | 📌 Pendente | 📌 Média |

## Ordem de Execução Recomendada

1. **5-1, 5-2** - Estrutura e autenticação
2. **5-3** - Sincronização base
3. **5-4, 5-5** - Execução recorrente e confiabilidade
4. **5-6, 5-7** - Operação e documentação
