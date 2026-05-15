# Task 9-7: Virada de chave — duas planilhas e ID `ano-sequência`

## Status
✅ Done

## Contexto
- **Planilha legada:** continua recebendo respostas do Google Form (aba `Form Responses 1`).
- **Planilha nova:** exclusiva do app (mesma aba `Form Responses 1`, layout compatível).
- **Sem convivência na mesma planilha** — evita colisão de linhas e de IDs entre Form e app.

## Padrão de ID (decisão atual)
- Formato operacional: `{ano}-{sequência}` (ex.: `2026-1`, `2026-2`).
- No banco: `anoSequencial` + `numeroSequencial` (sequência reinicia a cada ano, começando em 1).
- Coluna **AK** no Sheets recebe o ID formatado.
- Contador em `wp_Configuracao` (`COTACAO_SEQUENCIAL_POR_ANO`), com payload `byYear`.

## Variáveis de ambiente

| Variável | Uso |
|----------|-----|
| `GOOGLE_SHEETS_ID` | ID da **nova** planilha (somente app) |
| `GOOGLE_SHEETS_TAB_NAME` | `Form Responses 1` (padrão no código se omitido) |
| `GOOGLE_SHEETS_SYNC_ENABLED` | `true` em produção quando sync ativo |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Conta de serviço (inalterada) |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Chave (inalterada) |
| `COTACAO_SEQUENCIAL_SEED` | Seed global legado (opcional na planilha nova) |
| `COTACAO_SEQUENCIAL_SEED_2026` | Seed só para o ano 2026 (opcional; `0` → primeira cotação = `2026-1`) |

## Checklist operacional

### Planilha nova (app)
- [x] Criar planilha dedicada ao app (cópia do layout / mesmas colunas do legado).
- [x] Aba nomeada `Form Responses 1`.
- [x] Compartilhar com a service account (Editor).
- [x] Atualizar `GOOGLE_SHEETS_ID` no ambiente.
- [x] Rodar `npx prisma generate` e `npx prisma db push` após deploy do schema (ID `ano-sequência` como PK).
- [x] Validar primeira cotação gera `2026-1` (com seed 0 ou ausente).
- [x] Validar linha aparece na planilha nova após PDF/envio (sync em `pdf/route`, coluna AK).

### Planilha legada (Google Form)
- [ ] Manter Form ativo até data de corte acordada.
- [ ] Não apontar `GOOGLE_SHEETS_ID` do app para a planilha do Form.
- [ ] Comunicar equipe: IDs do Form (Response Number) ≠ IDs do app (`ano-N`).

### Go-live
- [ ] Desligar Google Form na data combinada.
- [ ] Confirmar que apenas a planilha nova recebe novas linhas do app.
- [ ] Arquivar planilha legada como somente leitura (opcional).

## Critérios de aceite (código)
- [x] Schema Prisma com `anoSequencial` e `@@unique([anoSequencial, numeroSequencial])`.
- [x] Contador por ano em `lib/cotacao/sequencial.ts`.
- [x] `criar` e `rascunho` persistem ano + sequência; API retorna `idOperacional`.
- [x] Sync Sheets usa `Form Responses 1` por padrão e coluna AK com `ano-N`.

## Impacto em dados existentes
- Cotações antigas sem `anoSequencial` mantêm apenas `numeroSequencial` legado; novas cotações sempre têm o par completo.
- Re-sync de cotações antigas no Sheets usa fallback de ano corrente apenas se `anoSequencial` estiver ausente (ver `formatarIdOperacionalCotacao`).
