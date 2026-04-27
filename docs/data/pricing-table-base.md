# Pricing Table Base
Weach Pricing and Media Recommender

Este arquivo guarda os dados base de precificacao que o sistema utiliza.  
Ele NAO contem formulas, apenas valores configuraveis e estruturas de tabelas.

Use este arquivo como referencia para popular o banco ou um seed de configuracoes.

============================================================
1. PARAMETROS GLOBAIS PROGRAMATICOS
============================================================

CPM base programatico (equivalente a D3 na planilha comercial):

- cpmbase_programatico_padrao: 4.00
- unidade: reais por mil impressoes

Faixas de budget para cenarios de desconto:

- cenario1_sem_desconto:
  - faixa_budget: ate 29.999
  - multiplicador: 1.00

- cenario2:
  - faixa_budget: de 30.000 a 49.999
  - multiplicador: 0.95

- cenario3:
  - faixa_budget: de 50.000 a 99.999
  - multiplicador: 0.90

- cenario4:
  - faixa_budget: acima de 100.000
  - multiplicador: 0.85

Obs: estes valores podem ser ajustados, mas a estrutura deve se manter.

============================================================
2. VALORES FIXOS PROGRAMATICOS (DERIVADOS DA PLANILHA)
============================================================

Estes sao valores que hoje estao fixos na planilha comercial e devem ser configurados aqui para nao ficarem hardcoded em codigo.

Display e derivados:

- native_diferenciado_cpm: 28.00
- display_retargeting_cpm: 15.00

Spotify e Deezer display:

- spotify_leaderboard_cpm: 18.00
- spotify_overlay_cpm: 72.00
- deezer_display_cpm: 72.00

Spotify e Deezer video:

- spotify_video_30_cpv: 0.25
- deezer_video_30_cpv: 0.25

Audio:

- spotify_audio_cpm: 65.00
- deezer_audio_cpm: 64.00

Social:

- linkedin_sponsored_cpm: 90.00
- linkedin_inmail_valor: 2.80
- kwai_valor_base: 9.00
- fb_lead_ad_valor_base: 65.00

Obs: os valores acima sao exemplos baseados na planilha.  
Ajuste para refletir os numeros oficiais da Weach.

============================================================
3. MAPEAMENTOS CONDICIONAIS POR CPMBASE
============================================================

Alguns precos variam conforme o CPM base (cpmbase_programatico).  
Abaixo, os mapeamentos em forma de tabela para serem replicados via logica no motor deterministico.

3.1 CTV Globo FAST (cpv) por cpmbase:

- se cpmbase = 4  → globo_fast_cpv = 0.17
- se cpmbase = 5  → globo_fast_cpv = 0.20
- se cpmbase = 7  → globo_fast_cpv = 0.20
- se cpmbase = 8  → globo_fast_cpv = 0.23
- se cpmbase = 9  → globo_fast_cpv = 0.25

3.2 Facebook Trafego (valor) por cpmbase:

- se cpmbase = 4  → fb_trafego_valor = 10.00
- se cpmbase = 5  → fb_trafego_valor = 12.00
- se cpmbase = 7  → fb_trafego_valor = 12.00
- se cpmbase = 8  → fb_trafego_valor = 14.00
- se cpmbase = 9  → fb_trafego_valor = 16.00

3.3 Facebook Engajamento (valor) por cpmbase:

- se cpmbase = 4  → fb_engajamento_valor = 3.00
- se cpmbase = 5  → fb_engajamento_valor = 4.00
- se cpmbase = 7  → fb_engajamento_valor = 4.00
- se cpmbase = 8  → fb_engajamento_valor = 4.50
- se cpmbase = 9  → fb_engajamento_valor = 5.00

============================================================
4. AJUSTES REGIONAIS (MULTIPLICADORES)
============================================================

Multiplicadores de preco por regiao, aplicados sobre o preco alvo:

- SP_Capital:        +0.20
- Sudeste_ex_SP:     +0.10
- Sul:               +0.00
- Centro_Oeste:      +0.00
- Nordeste:          -0.10
- Norte:             -0.15
- Cidades_menores:   -0.15

Obs: “Cidades_menores” pode ser definido como municipios abaixo de 300 mil habitantes, ou logica equivalente.

============================================================
5. BASE CPL E CPI POR SEGMENTO (PARA PREENCHER)
============================================================

Aqui entra a parte em que segmento realmente importa (CPL e CPI).  
Preencha os campos de acordo com a politica comercial da Weach.

Tabela conceitual (valores em reais):

Segmento: Automotivo
- cpl_min: preencher
- cpl_alvo: preencher
- cpl_max: preencher
- cpi_min (se aplicavel): preencher
- cpi_alvo: preencher
- cpi_max: preencher

Segmento: Financeiro
- cpl_min: preencher
- cpl_alvo: preencher
- cpl_max: preencher
- cpi_min: preencher
- cpi_alvo: preencher
- cpi_max: preencher

Segmento: Varejo
- cpl_min: preencher
- cpl_alvo: preencher
- cpl_max: preencher

Segmento: Imobiliario
- cpl_min: preencher
- cpl_alvo: preencher
- cpl_max: preencher

Segmento: Saude
- cpl_min: preencher
- cpl_alvo: preencher
- cpl_max: preencher

Segmento: Educacao
- cpl_min: preencher
- cpl_alvo: preencher
- cpl_max: preencher

Segmento: Telecom
- cpl_min: preencher
- cpl_alvo: preencher
- cpl_max: preencher

Segmento: Outros
- cpl_min: preencher
- cpl_alvo: preencher
- cpl_max: preencher

============================================================
6. NOTAS FINAIS
============================================================

- Este arquivo é fonte de verdade para populacao inicial do banco.
- Nao coloque formulas aqui, apenas valores.
- Sempre que mudar a politica de preco, atualize este arquivo e as tabelas correspondentes no banco.