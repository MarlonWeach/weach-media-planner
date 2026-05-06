# Task 8B-4: Implementar trilha de alterações de racional e preço

## Status
✅ Done

## Descrição
Registrar alterações relevantes de racional e preço final em trilha de auditoria operacional.

## Implementação
- Reuso da tabela `wp_LogAlteracaoPreco` para auditoria de performance:
  - `campo = PERFORMANCE_RACIONAL`
  - `campo = PERFORMANCE_PRECO_FINAL`
- Geração de log condicionada a mudança real entre valor anterior e novo valor.
- Motivo do ajuste associado ao log (`motivoAjustePreco`).

## Critérios de Aceite
- [x] Alterações de racional são auditadas.
- [x] Alterações de preço final são auditadas.
- [x] Logs incluem autor, cotação, valor anterior/novo e motivo.

