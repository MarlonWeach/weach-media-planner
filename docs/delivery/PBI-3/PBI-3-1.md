# Task 3-1: Serviço e API interna de relatórios comerciais

## Status
✅ Done

## Objetivo
Base técnica para relatórios **internos** (não API pública): agregações reutilizáveis e endpoint autenticado.

## Entregue
- `lib/relatorios/` — filtros, permissões, labels, `gerarRelatorioComercial`
- `GET /api/relatorios` — JSON ou `?format=csv`
- Permissões: ADMIN/EXTERNO visão global; COMERCIAL só próprias cotações

## Verificação
1. Login como admin ou manager.
2. Abrir `/relatorios` ou `GET /api/relatorios` com Bearer token.
3. Aplicar filtros de data e exportar CSV.
