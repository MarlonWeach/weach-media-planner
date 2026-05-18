# Tasks - PBI-3: Relatórios e Dashboard

## Status Geral
🔄 InProgress (MVP comercial entregue; PDF agregado pendente)

## Tasks

| ID | Descrição | Status | Prioridade |
|----|-----------|--------|------------|
| 3-1 | Serviço + rota interna `GET /api/relatorios` (base com filtros) | ✅ Done | 🚨 Crítica |
| 3-2 | Relatório de cotações por período | ✅ Done | ⚠️ Alta |
| 3-3 | Relatório de segmentos | ✅ Done | ⚠️ Alta |
| 3-4 | Relatório de mix médio por canal | ✅ Done | ⚠️ Alta |
| 3-5 | Relatório de desvios de preço (performance) | ✅ Done | ⚠️ Alta |
| 3-6 | Página `/relatorios` com visualizações | ✅ Done | 📌 Média |
| 3-7 | Exportação CSV | ✅ Done | 📌 Média |
| 3-8 | Exportação PDF de relatórios agregados | 📌 Pendente | 📎 Baixa |
| 3-9 | Exportar plano de mídia da cotação em Excel + anexo no e-mail | ✅ Done | 📌 Média |

## Ordem de Execução Recomendada

1. ~~**3-1**~~ — API e `lib/relatorios`
2. ~~**3-2 … 3-7, 3-6**~~ — entregues no mesmo pacote `/relatorios`
3. **3-8** — PDF opcional (impressão ou gerador)
4. PBI futuro — HubSpot CRM

## Observações

- Acesso: header **Relatórios** + card no Admin.
- Managers (`EXTERNO`) têm a mesma visão global que admin nos relatórios.
