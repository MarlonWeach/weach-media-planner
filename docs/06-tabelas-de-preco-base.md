# Tabelas de Preço Base — Programática (Derivadas do CPM em D3)

---

Este documento descreve a **estrutura oficial de precificação programática** da Weach, tomando como referência a planilha `Calculo de valores comercial.xlsx`, aba **Planilha1**.

Tudo gira em torno de um único parâmetro central:

> **CPM Base Programático** = célula **D3**

A partir de **D3**, todas as demais tarifas de Display, Vídeo, CTV, Áudio e Social são calculadas por fórmulas.

⚠️ **Importante:**  
- As lógicas deste arquivo se aplicam a **mídia programática (CPM, CPC, CPV, CPCL, etc.)**.  
- A parte de **segmento / vertical de anunciante** é relevante para **CPL / CPI**, e será tratada em um documento específico (CPL/CPI).  
- Aqui focamos apenas em **programática**.

---

## 1. Parâmetro-chave: CPM Base (D3)

- **D3** é o valor de CPM base utilizado como referência em toda a planilha.
- Exemplo atual na planilha: `D3 = 4` (R$ 4,00)

Esse valor é usado para:

- Definir o **CPM de Display** básico.
- Calcular Gama, Retargeting e CPC.
- Gerar CPVs de Vídeo.
- Ajustar preços de CTV e Social com fórmulas condicionais.

Na implementação do sistema:

- Este valor deve ser configurável (por admin) e armazenado como variável ou registro em tabela de configuração.
- Alterar D3 muda todo o pricing programático de forma consistente.

---

## 2. Bloco “Formatos de Display” (linha 2–3)

Linha de cabeçalho (B2:K2):

- **B2:** "Formatos de Display"
- **D2:** "CPM"
- **E2:** "Gama"
- **F2:** "Native Diferenciado"
- **G2:** "Display - CPM Retargeting"
- **H2:** "CPC"
- **I2:** "Spotify Leader Board"
- **J2:** "Spotify Overlay"
- **K2:** "Deezer Display"

Valores/lógicas principais (linha 3):

- **D3 – CPM Display Base**
  - Valor: `D3` (editável)
  - Interpretação: CPM padrão de Display.

- **E3 – Gama**
  - Fórmula: `E3 = D3 + 1,75`
  - Interpretação: CPM incrementado para pacote Gama.

- **F3 – Native Diferenciado**
  - Valor atual: `28` (valor fixo na planilha)
  - Sugestão: Tornar configurável em tabela de preços.

- **G3 – Display Retargeting (CPM)**
  - Valor atual: `15` (fixo na planilha)
  - Sugestão: Configurável na base.

- **H3 – CPC Display**
  - Fórmula: `H3 = D3 * 0,625`
  - Interpretação: CPC calculado como 62,5% do CPM base convertido em custo por clique segundo um CTR implícito.

- **I3 – Spotify Leader Board**
  - Valor atual: `18` (fixo)

- **J3 – Spotify Overlay**
  - Valor atual: `72` (fixo)

- **K3 – Deezer Display**
  - Valor atual: `72` (fixo)

### Estrutura sugerida em banco para esse bloco

Uma tabela `preco_display_programatico` com colunas:

- `cpmbase` (equivalente a D3)
- `gama` (E3)
- `native_diferenciado` (F3)
- `retargeting_cpm` (G3)
- `cpc_display` (H3)
- `spotify_leaderboard` (I3)
- `spotify_overlay` (J3)
- `deezer_display` (K3)

---


## 4. Bloco “Formatos de Vídeo” (linhas 8–9)

Cabeçalho (linha 8):

- **B8:** "Formatos de Video"
- **D8:** `Vídeo 15" - CPCV`
- **E8:** `Vídeo 30" - CPCV`
- **F8:** `Youtube Bumper 6" - CPCV`
- **G8:** `Youtube 30" - CPCV`
- **H8:** `Spotify Video 30" - CPCV`
- **I8:** `Deezer Video 30" - CPCV`

Cálculos (linha 9):

- **E9 – CPV Base Vídeo 30"**
  - Fórmula: `E9 = D3 / 115`
  - Interpretação: CPV base vinculado ao CPM padrão dividido por um fator (115).

- **D9 – CPV Vídeo 15"**
  - Fórmula: `D9 = E9 * 0,85`  
  - Interpretação: 15" mais barato que 30".

- **F9 – Youtube Bumper 6"**
  - Fórmula: `F9 = D9`  
  - Usa o mesmo CPV do vídeo 15".

- **G9 – Youtube 30"**
  - Fórmula: `G9 = E9 * 2`  
  - CPV dobrado em relação ao vídeo 30" base.

- **H9 – Spotify Video 30"**
  - Valor fixo: `0,25`

- **I9 – Deezer Video 30"**
  - Valor fixo: `0,25`

### Estrutura sugerida

Tabela `preco_video_programatico` com campos:

- `cpv_video_15` (D9)
- `cpv_video_30` (E9)
- `cpv_youtube_bumper_6` (F9)
- `cpv_youtube_30` (G9)
- `cpv_spotify_video_30` (H9)
- `cpv_deezer_video_30` (I9)

Todos dependentes de D3 (exceto H9/I9 fixos).

---

## 5. Bloco “Formatos de Video CTV” (linhas 11–12)

Cabeçalho (linha 11):

- **B11:** "Formatos de Video CTV"
- **D11:** `CTV 30" (Open) - CPCV`
- **E11:** `Globo FAST CPCV`
- **F11:** `GloboPlay 15" CPCV`
- **G11:** `Samsung FAST CPCV`
- **H11:** `Philips / AOC CPCV`
- **I11:** `MAX / Netflix / Disney+ / Outros`

Cálculos (linha 12):

- **D12 – CTV 30" Open**
  - Fórmula: `D12 = E9`
  - Ou seja, CPV CTV open = CPV vídeo 30" base.

- **E12 – Globo FAST**
  - Fórmula condicional:
    ```excel
    =IF(D3=4,0.17,
      IF(D3=5,0.20,
        IF(D3=7,0.20,
          IF(D3=8,0.23,
            IF(D3=9,0.25,"")
          )
        )
      )
    )
    ```
  - Interpretação: CPV por Globo FAST é escolhido a partir do valor de CPM base (D3).

- Outros campos para F11/G11/H11/I11 podem seguir lógica análoga ou valores fixos configurados (a planilha atual traz apenas E12 explicitamente com lógica condicional).

### Implementação

No backend, modelar uma função que:

- Recebe `cpmbase` (D3).
- Retorna os CPVs específicos para CTV conforme tabela condicional (como se fosse um `CASE`/`switch`).

---

## 6. Bloco “Formatos de Áudio” (linhas 14–15)

Cabeçalho (linha 14):

- **B14:** "Formatos de Audio"
- **D14:** `Spotify Audio`
- **E14:** `Spotify CPCL (complete listening)`
- **F14:** `Deezer Audio`
- **G14:** `Deezer CPCL (complete listening)`

Valores (linha 15):

- **D15 – Spotify Audio**
  - Valor fixo: `65`

- **E15 – Spotify CPCL**
  - Fórmula: `E15 = E9 * 4`
  - CPCL calculado a partir do CPV base de vídeo 30" (E9).

- **F15 – Deezer Audio**
  - Valor fixo: `64`

- **G15 – Deezer CPCL**
  - Fórmula: `G15 = E9 * 5`

### Implementação

Tabela `preco_audio_programatico`:

- `spotify_audio_cpm` (D15)
- `spotify_cpcl` (E15)
- `deezer_audio_cpm` (F15)
- `deezer_cpcl` (G15)

---

## 7. Bloco “Formatos de Social” (linhas 17–18)

Cabeçalho (linha 17):

- **B17:** "Formatos de Social"
- **D17:** `Linkedin Sponsored`
- **E17:** `Linkedin Inmail`
- **F17:** `Kwai`
- **G17:** `FB Trafego`
- **H17:** `FB Engajamento`
- **I17:** `FB lead ad`

Valores e fórmulas (linha 18):

- **D18 – Linkedin Sponsored**
  - Valor fixo: `90`

- **E18 – Linkedin Inmail**
  - Valor fixo: `2,8` (provavelmente CPC ou CPV dependendo da unidade; manter como configurável)

- **F18 – Kwai**
  - Valor fixo: `9`

- **G18 – FB Tráfego (CPC?)**
  - Fórmula condicional:
    ```excel
    =IF(D3=4,10,
      IF(D3=5,12,
        IF(D3=7,12,
          IF(D3=8,14,
            IF(D3=9,16,"")
          )
        )
      )
    )
    ```
  - Valor varia conforme `cpmbase`.

- **H18 – FB Engajamento**
  - Fórmula:
    ```excel
    =IF(D3=4,3,
      IF(D3=5,4,
        IF(D3=7,4,
          IF(D3=8,4.5,
            IF(D3=9,5,"")
          )
        )
      )
    )
    ```

- **I18 – FB Lead Ad**
  - Valor fixo: `65` (provavelmente CPL base programático)

### Implementação

Tabela `preco_social_programatico`:

- `linkedin_sponsored` (D18)
- `linkedin_inmail` (E18)
- `kwai` (F18)
- `fb_trafego` (G18 – função condicional de cpmbase)
- `fb_engajamento` (H18 – função condicional)
- `fb_lead_ad` (I18)

---

## 8. Bloco “Segmentações relativamente abertas / Geo” (linhas 20–22)

Trecho:

- **B20:** "Segmentações relativamente abertas"
- **B21:** "Nacional" — D21: `4`
- **B22:** "Estados" — D22: `7`

Interpretação:

- `Nacional` → CPM base de 4
- `Estados` → CPM base de 7

Isso serve como referência de **CPM base para clusters de segmentação aberta**, podendo ser usado pelo motor para entender:

- CPM típico para segmentação nacional x estadual.

### Importante

- Esses valores podem alimentar:
  - Parametrização de `D3` (quando campanha é mais aberta/mais segmentada).
  - Regras adicionais para campanhas **CPL/CPI**, onde segmentação faz mais diferença.

---

## 9. CPL / CPI — Observação (não programático)

- As tabelas e lógicas acima **não** consideram segmentação por vertical (automotivo, varejo, financeiro etc.).
- Essas segmentações passam a ser essenciais em **modelos de CPL / CPI**, onde:
  - Custo por lead/instalação depende fortemente do setor.
  - Pode haver **tabelas distintas de preço** por segmento e tipo de ação.

🔜 Para CPL/CPI recomenda-se criar **outro arquivo** (ex.: `06b-tabelas-base-cpl-cpi.md`) com:

- Tabela de CPL/CPI por vertical.
- Fatores de complexidade/maturidade.
- Eventual uso dos valores de mídia programática como base de custo.

---

## 10. Resumo de Implementação

- **Variável central:** `cpmbase_programatico` ↔ célula D3.
- A partir dela, o sistema deve:
  - Calcular preços de Display (CPM, CPC, Gama, Retargeting).
  - Calcular CPV de Vídeo.
  - Calcular CPV/CPCL de CTV e Áudio.
  - Aplicar regras condicionais de Social.
- Os valores fixos (ex.: 28, 15, 72, 0.25, 65, 90, 2.8, 9, 65 etc.) devem ser expostos como **configuráveis** na camada de admin (não hardcoded), mas a lógica de dependência em relação a D3 deve ser preservada.