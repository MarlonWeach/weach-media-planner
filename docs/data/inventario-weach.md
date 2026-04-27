# Inventario Weach
Weach Pricing and Media Recommender

Este arquivo descreve, em alto nivel, os tipos de inventario de midia operados pela Weach, agrupados por categoria.  
Serve como referencia para o sistema saber quais canais podem ser usados no plano de midia.

============================================================
1. CATEGORIAS PRINCIPAIS DE INVENTARIO
============================================================

Categoria ID: display_programatico
Nome: Display Programatico
Descricao: Inventario display em open web e deals privados via DSPs.

Categoria ID: video_programatico
Nome: Video Programatico
Descricao: Inventario de video em sites, apps e players, incluindo instream e outstream.

Categoria ID: ctv
Nome: Connected TV
Descricao: Inventario de CTV em canais FAST, AVOD e apps de TV conectada.

Categoria ID: audio_digital
Nome: Audio Digital
Descricao: Inventario de audio em plataformas de streaming.

Categoria ID: social_programatico
Nome: Social via Programatico
Descricao: Posicionamentos comprados via parceiros programaticos em redes sociais e short video apps.

Categoria ID: crm_media
Nome: CRM Media
Descricao: Disparos em canais de contato direto com o usuario (WhatsApp, SMS, Push).

Categoria ID: in_live
Nome: In Live e Eventos
Descricao: Integracoes de midia e branded content em eventos ao vivo, lives e conteudos especiais.

Categoria ID: cpl_cpi
Nome: Produtos CPL e CPI
Descricao: Produtos onde a negociacao e baseada em custo por lead ou custo por instalacao.

============================================================
2. SUBTIPOS E PARCEIROS (ALTO NIVEL)
============================================================

Display Programatico:
- Open Web via DSP (DV360, etc)
- Curated deals em portais premium
- Segmentacoes por interesse, contexto, DMP

Video Programatico:
- Instream em portais de video
- Outstream em formatos infeed
- Pre-roll e mid-roll

CTV:
- Canais FAST
- Apps de TV conectada (GloboPlay, Samsung, Philips, outros parceiros)
- Inventario aberto e pacotes especificos

Audio Digital:
- Spotify Audio e Display
- Deezer Audio e Display
- Outros parceiros de streaming de audio

Social Programatico:
- Linkedin Sponsored
- Linkedin Inmail
- Kwai
- Outros short-video partners via DSP ou plataforma parceira

CRM Media:
- Disparos de WhatsApp em bases opt in
- Disparos de SMS em bases qualificadas
- Push notifications em apps parceiros, quando aplicavel

In Live:
- Insercoes em lives patrocinadas
- Integracoes em eventos, streams e transmissoes

CPL e CPI:
- Landing pages proprietarias para captacao de lead
- Fluxos de cadastro otimizados
- Campanhas orientadas a acao final (lead ou instalacao)

============================================================
3. USO NO SISTEMA
============================================================

- O plano de midia sugerido pela IA sempre deve referenciar apenas inventarios que existam nesta lista.
- A camada deterministica de precificacao mapeia cada canal desta lista para:
  - modelo de compra (CPM, CPV, CPCL, CPL, etc)
  - estrutura de precos base
- Novos inventarios podem ser adicionados futuramente, mantendo o mesmo padrao de categoria e descricao.