# Referência de Regras de Preço (Excel)

## Contexto
Este documento consolida as regras extraídas da planilha `Calculo de valores comercial.xlsx` para servir como referência de negócio na implementação das tasks `2-4` e `2-5`.

## Fonte
- Arquivo: `Calculo de valores comercial.xlsx`
- Aba principal: `Planilha1`

## Ordem de aplicação das regras
1. Definir valor base `CPM D3`.
2. Aplicar contexto regional (segmentação geográfica de referência).
3. Aplicar regra do canal/formato/modelo de compra.
4. Aplicar cenário de budget.

## Valor base e cenários de budget
- `D3`: valor base (na planilha atual, `4`).
- Faixas de cenário:
  - `R$ 30.000 a 49.999` -> multiplicador `0.95`
  - `R$ 50.000 a 99.999` -> multiplicador `0.90`
  - `R$ 100.000+` -> multiplicador `0.85`

## Segmentação geográfica de referência
- Nacional -> `4`
- Estados -> `7`
- Cidades grandes -> `8`
- Cidades pequenas -> `9`

## Blocos de formatos/canais

### Display
- CPM
- Gama
- Native Diferenciado
- Display Retargeting (CPM)
- CPC
- Spotify Leaderboard
- Spotify Overlay
- Deezer Display

### Vídeo
- Vídeo 15" (CPCV)
- Vídeo 30" (CPCV)
- YouTube Bumper 6" (CPCV)
- YouTube 30" (CPCV)
- Spotify Video 30" (CPCV)
- Deezer Video 30" (CPCV)

### CTV
- CTV 30" Open
- Globo FAST
- GloboPlay 15"
- Samsung FAST
- Philips/AOC
- MAX / Netflix / Disney+ / Outros

### Áudio
- Spotify Audio
- Spotify CPCL
- Deezer Audio
- Deezer CPCL

### Social
- LinkedIn Sponsored
- LinkedIn Inmail
- Kwai
- TikTok
- FB Tráfego
- FB Engajamento
- FB Lead Ad

### Geofence
- Display 3km
- Vídeo 3km

## Observações importantes da planilha
- Existem fórmulas condicionais `IF(...)` dependentes do valor base e/ou contexto regional.
- Parte dos formatos usa valor fixo absoluto; parte deriva de fórmulas.
- Alguns campos do Excel apontam para placeholders/notas e devem ser tratados como pendência de regra de negócio na implementação final.

## Uso prático
- Task `2-4`: consolidar valores fixos administráveis.
- Task `2-5`: consolidar regras condicionais/fórmulas administráveis.
