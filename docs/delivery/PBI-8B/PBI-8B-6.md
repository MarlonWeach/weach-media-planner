# Task 8B-6: Criar consulta/relatório base para preparação de dataset de IA

## Status
✅ Done

## Descrição
Implementar consulta operacional para extração do dataset base de performance com racional e preço final.

## Entregas
- API `GET /api/admin/performance-historico`:
  - lista paginada de registros do histórico de performance;
  - filtros básicos por busca.
- API `GET /api/admin/performance-historico/report`:
  - exportação em `JSON`;
  - exportação em `CSV` (`?format=csv`).
- Botão de exportação CSV na tela administrativa do histórico.

## Critérios de Aceite
- [x] Consulta base disponível para análise.
- [x] Export estruturado para consumo externo/dataset.
- [x] Acesso restrito a administradores.

