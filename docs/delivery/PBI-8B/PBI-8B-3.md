# Task 8B-3: Implementar persistência de racional humano por cotação/formato

## Status
✅ Done

## Descrição
Implementar persistência operacional do racional humano por cotação/formato, com atualização de preço final aplicado e metadados de decisão.

## Entregas
- Utilitário `lib/performance/historico.ts` para:
  - extrair histórico de performance;
  - atualizar observações com registro específico;
  - sincronizar registros base com mix do Step 4.
- API `POST /api/admin/performance-historico` para criar/atualizar racional por formato.
- Sincronização automática no `POST /api/cotacao/rascunho` quando `step4.mix` é salvo.

## Resultado
- Cada formato da cotação passa a ter registro persistido com preço de tabela e preço final.
- Racional textual e tags ficam estruturados para revisão e consulta futura.

## Critérios de Aceite
- [x] Persistência por cotação/formato implementada.
- [x] Atualização incremental sem sobrescrever dados de outros formatos.
- [x] Metadados de autoria e data registrados.

