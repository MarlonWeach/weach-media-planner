# Task 3-9: Excel do plano de mídia na cotação (espelho do PDF comercial)

## Status
Done

## Objetivo
Entregar o conteúdo do **plano de mídia** da cotação também em **Excel (.xlsx)**, com as mesmas linhas, colunas e textos formatados que o **PDF comercial** (`geradorPDF`), incluindo resumo executivo, tabela do plano, estimativas e rodapé comercial.

## Escopo
- Fonte única de dados da tabela (compartilhada entre PDF e Excel).
- Download autenticado: `GET /api/cotacao/[id]/excel`.
- No envio da cotação (`POST .../pdf`): anexar o `.xlsx` ao e-mail quando o PDF do plano for gerado (mesma regra que hoje para `apenasPerformance`).

## Fora de escopo
- Briefing em Excel (continua só PDF de briefing).
- Alterar o layout visual do PDF além do necessário para reutilizar a tabela.

## Verificação
- Gerar cotação com mix programático: PDF e Excel com mesmas linhas na tabela de plano e mesma seção de estimativas.
- Cotação só performance: e-mail sem anexo do plano tabular (como hoje para PDF do plano).
