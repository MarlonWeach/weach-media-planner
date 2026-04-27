# Formatos Publicitarios
Weach Pricing and Media Recommender

Este arquivo documenta os formatos de anuncio usados pela Weach, associados a cada tipo de inventario.  
Serve como referencia para ingestao no frontend (dropdowns) e para a camada de precificacao.

============================================================
1. DISPLAY PROGRAMATICO
============================================================

Inventario: display_programatico

Formatos principais:
- banner_padrao_300x250
  - Nome: Banner padrao 300x250
  - Modelo compra tipico: CPM
  - Observacao: formato base da rede display.

- banner_leaderboard_728x90
  - Nome: Leaderboard 728x90
  - Modelo compra tipico: CPM

- banner_halfpage_300x600
  - Nome: Half Page 300x600
  - Modelo compra tipico: CPM

- interstitial
  - Nome: Interstitial full screen
  - Modelo compra tipico: CPM

- native
  - Nome: Native padr  o feed
  - Modelo compra tipico: CPM ou CPC (dependendo da negociacao)

============================================================
2. VIDEO PROGRAMATICO
============================================================

Inventario: video_programatico

Formatos principais:
- video_6s_bumper
  - Nome: Video bumper 6 segundos
  - Modelo compra tipico: CPV

- video_15s
  - Nome: Video 15 segundos
  - Modelo compra tipico: CPV

- video_30s
  - Nome: Video 30 segundos
  - Modelo compra tipico: CPV

- video_outstream
  - Nome: Video outstream in feed
  - Modelo compra tipico: CPV ou CPM

============================================================
3. CTV
============================================================

Inventario: ctv

Formatos principais:
- ctv_30s_open
  - Nome: CTV 30 segundos open inventory
  - Modelo compra tipico: CPV

- ctv_30s_globo_fast
  - Nome: CTV 30 segundos Globo FAST
  - Modelo compra tipico: CPV

- ctv_15s_globoplay
  - Nome: CTV 15 segundos GloboPlay
  - Modelo compra tipico: CPV

- ctv_30s_pacotes_premium
  - Nome: CTV 30 segundos pacotes premium (Max, Netflix, Disney plus, outros)
  - Modelo compra tipico: CPV

============================================================
4. AUDIO DIGITAL
============================================================

Inventario: audio_digital

Formatos principais:
- spotify_audio_30s
  - Nome: Spotify audio 30 segundos
  - Modelo compra tipico: CPM

- spotify_audio_cpcl
  - Nome: Spotify CPCL (complete listening)
  - Modelo compra tipico: CPCL

- deezer_audio_30s
  - Nome: Deezer audio 30 segundos
  - Modelo compra tipico: CPM

- deezer_audio_cpcl
  - Nome: Deezer CPCL (complete listening)
  - Modelo compra tipico: CPCL

============================================================
5. SOCIAL PROGRAMATICO
============================================================

Inventario: social_programatico

Formatos principais:
- linkedin_sponsored_content
  - Nome: Linkedin Sponsored Content
  - Modelo compra tipico: CPC ou CPM

- linkedin_inmail
  - Nome: Linkedin InMail
  - Modelo compra tipico: CPC ou CPMS

- kwai_video
  - Nome: Kwai video in feed
  - Modelo compra tipico: CPV ou CPC

- facebook_trafego
  - Nome: Facebook trafego
  - Modelo compra tipico: CPC

- facebook_engajamento
  - Nome: Facebook engajamento
  - Modelo compra tipico: CPC

- facebook_lead_ads
  - Nome: Facebook Lead Ads
  - Modelo compra tipico: CPL (base programatica para este produto)

============================================================
6. CRM MEDIA
============================================================

Inventario: crm_media

Formatos principais:
- whatsapp_disparo
  - Nome: Disparo de WhatsApp
  - Modelo compra tipico: CPD (custo por disparo)

- sms_disparo
  - Nome: Disparo de SMS
  - Modelo compra tipico: CPD

- push_notification
  - Nome: Push notification
  - Modelo compra tipico: CPD ou CPM (dependendo do parceiro)

============================================================
7. IN LIVE E EVENTOS
============================================================

Inventario: in_live

Formatos principais:
- integracao_live
  - Nome: Integracao de marca em live
  - Modelo compra tipico: pacote fechado (valor unico)

- cota_patrocinio_evento
  - Nome: Cota de patrocinio de evento ou streaming
  - Modelo compra tipico: pacote fechado

============================================================
8. PRODUTOS CPL E CPI
============================================================

Inventario: cpl_cpi

Formatos principais:
- cpl_lead_form
  - Nome: Captacao de lead em landing page
  - Modelo compra tipico: CPL

- cpl_lead_meta
  - Nome: Captacao de lead via Meta Lead Ads operada pela Weach
  - Modelo compra tipico: CPL

- cpi_app_install
  - Nome: Campanha de instalacao de app
  - Modelo compra tipico: CPI

============================================================
9. USO NO SISTEMA
============================================================

- Cada formato deve ser associado a:
  - inventario
  - modelo de compra principal
- O plano de midia pode listar:
  - inventario
  - formato
  - modelo
  - preco
- Novos formatos podem ser adicionados com o mesmo padrao: id simples, nome e modelo tipico.