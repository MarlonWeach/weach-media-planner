# Task 9-4: Implementar integração de escrita no Google Sheets com mapeamento de perguntas/respostas

## Status
✅ Done

## Descrição
Adicionar integração para registrar no Google Sheets as respostas de cotação enviadas pelo sistema, preservando contexto operacional e ligação com o novo ID sequencial.

## Objetivo
Manter a visão unificada no Sheets durante a fase de convivência com o Google Form.

## Critérios de Aceite
- [x] Existe serviço dedicado para escrita no Google Sheets.
- [x] A sincronização inclui ID da cotação (UUID) e `numeroSequencial`.
- [x] As respostas estruturadas em `observacoes` são mapeadas para linhas campo/valor.
- [x] A sincronização é controlada por flag de ambiente para ativação segura.

## Implementação
- Criado `lib/integrations/googleSheetsCotacao.ts`.
- Adicionada dependência `googleapis` no projeto.
- O serviço usa Service Account (`JWT`) e `spreadsheets.values.append`.
- A escrita foi ajustada para o layout legado colunar (`A:AK`) em uma linha por cotação.
- Regras de unificação aplicadas:
  - `N` como budget único;
  - `T` como observação geral única;
  - `Z` como anexo único por link;
  - `M` para modelos de Performance, `U` para Programática e `AA` para WhatsApp/SMS/PUSH.
- Campos legados descontinuados no novo fluxo são enviados vazios (`X`, `AB`, `AC`, `AD`, `AE`).
- Integração acoplada ao fluxo `POST /api/cotacao/[id]/pdf` após envio de e-mail da cotação.

## Variáveis de Ambiente
- `GOOGLE_SHEETS_SYNC_ENABLED` (`true/false`)
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `GOOGLE_SHEETS_ID`
- `GOOGLE_SHEETS_TAB_NAME` (opcional, padrão `Cotacoes`)

## Observações
- Com `GOOGLE_SHEETS_SYNC_ENABLED=false`, o sistema mantém comportamento atual sem sincronizar.
