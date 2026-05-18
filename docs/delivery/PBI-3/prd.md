# PBI-3: Fase 3 - Relatórios e Dashboard

## Status
🔄 InProgress

## Descrição
Painel de **relatórios internos** para diretores e gestores comerciais: transformar dados de `wp_Cotacao` em insights sobre volume, segmentos, mix, conversão e desvios de preço (performance).

**Não é** API pública para terceiros (isso é PBI-7). **Não é** integração HubSpot neste PBI — um PBI futuro de CRM consumirá as mesmas agregações.

## Público-alvo
- **ADMIN** e **MANAGER** (role `EXTERNO` na base): visão global de todas as cotações.
- **COMERCIAL**: visão restrita às próprias cotações.

## Objetivo
Fornecer visão estratégica sobre cotações, performance, segmentos e precificação para decisão comercial.

## Arquitetura (3-1)

```
/relatorios (UI)
    → GET /api/relatorios (JWT, uso interno)
    → lib/relatorios/agregacoes.ts
    → PostgreSQL (Prisma)
```

Exportação: `?format=csv`. PDF de relatórios agregados: task 3-8 (pendente).

## Entregáveis

### Relatórios (implementados na base 3-1–3-7)
- [x] KPIs: volume, budget, ticket médio, taxa aceite/recusa, em análise
- [x] Cotações por período (mês)
- [x] Segmentos mais ativos
- [x] Mix médio por canal
- [x] Por status, objetivo, escopo, vendedor (visão global)
- [x] Desvios preço tabela vs final (performance)
- [x] Exportação CSV
- [ ] Exportação PDF agregado (3-8)

### Visualizações
- [x] Gráficos em barras (CSS) na página `/relatorios`

## Critérios de Aceite
- [x] Relatórios em tempo real a partir do banco
- [x] Filtros por período, segmento, vendedor (quando visão global)
- [x] Exportação CSV
- [x] Dados consistentes com listagem de cotações
- [x] Interface responsiva

## Dependências
- PBI-1 (MVP Funcional)
- PBI-2 (Admin - para dados de configuração)

## Referências
- `docs/02-requisitos-funcionais.md` - RF10
- `lib/relatorios/` — motor de agregação
- PBI futuro sugerido: **HubSpot CRM** — sync de deals/KPIs
