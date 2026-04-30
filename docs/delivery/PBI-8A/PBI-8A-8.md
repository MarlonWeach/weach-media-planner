# Task 8A-8: Anexar PDF de briefing (espelho do formulário) apenas no e-mail operacional

## Status
✅ Done

## Objetivo
Gerar um segundo anexo em PDF com espelho do briefing (perguntas e respostas do formulário) e enviá-lo somente no e-mail operacional de cotação, sem alterar o comportamento de visualização/download do PDF principal no clique de "Enviar cotação".

## Escopo Implementado
- Geração de PDF adicional de briefing no backend durante o fluxo de envio de cotação.
- Anexo simultâneo de dois PDFs no e-mail operacional:
  - PDF principal do plano de mídia;
  - PDF de briefing (espelho do formulário).
- Ajuste para não expor o PDF de briefing na resposta da rota (continua retornando apenas o PDF principal).
- Reforço de fallback de `Observações Gerais` para não exibir macros/JSON bruto no corpo do e-mail e no PDF de briefing.

## Critérios de Aceite
- [x] E-mail operacional recebe dois anexos.
- [x] Clique em "Enviar cotação" mantém entrega visual apenas do PDF principal.
- [x] PDF de briefing não aparece como entrega ao usuário final na UI.
- [x] Campo "Observações Gerais" não exibe payload JSON/macros.

## Arquivos Alterados
- `app/api/cotacao/[id]/pdf/route.ts`
- `lib/notifications/cotacaoEmail.ts`
- `lib/pdf/geradorBriefingPDF.ts`
