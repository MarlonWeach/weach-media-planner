# UI UX Wireframes e Arquitetura de Telas
Weach Pricing and Media Recommender

Este documento descreve a experiencia do usuario, fluxo e estrutura visual das telas principais do sistema. Nao utiliza caracteres especiais, ASCII art ou marcacoes que possam quebrar o bloco de markdown.

============================================================
1. PRINCIPIOS DE UX
============================================================

- Velocidade: fluxo completo para criar uma cotacao em poucos passos.
- Clareza: organizacao visual simples, campos bem agrupados.
- Governanca: avisos claros de margem, piso e teto.
- Flexibilidade: comercial pode ajustar valores dentro das regras.
- Consistencia: identidade visual Weach aplicada em tudo.
- Explicabilidade: IA sempre gera racional estrategico.

============================================================
2. ARQUITETURA DE NAVEGACAO
============================================================

Fluxo geral de paginas:

Login
Dashboard
Nova Cotacao (fluxo em 4 passos)
Minhas Cotacoes
Configuracoes (Admin)
Tabelas de Preco (Admin)
Relatorios (Admin)

============================================================
3. WIREFRAMES TEXTUAIS (SEGUROS)
============================================================

Abaixo estao wireframes em formato textual, evitando caracteres que possam quebrar markdown. Sao representacoes simples e seguras das telas.

------------------------------------------------------------
3.1 Tela de Login
------------------------------------------------------------

Tela de Login:
- Campo Email
- Campo Senha
- Botao Entrar
- Link Esqueceu a senha

------------------------------------------------------------
3.2 Dashboard do Comercial
------------------------------------------------------------

Dashboard:
- Botao Nova Cotacao
- Lista de ultimas cotacoes com status e data
- Filtros: Segmento, Status, Data

------------------------------------------------------------
3.3 Cotacao Passo 1 Dados do Cliente
------------------------------------------------------------

Campos:
- Nome do cliente
- Segmento
- URL da landing page
- Observacoes iniciais
Botoes:
- Voltar
- Proximo

------------------------------------------------------------
3.4 Cotacao Passo 2 Objetivo e Perfil Digital
------------------------------------------------------------

Campos:
- Objetivo da campanha
- Maturidade digital (baixa, media, alta)
- Aceita modelo hibrido? (sim, nao)
- Tolerancia ao risco (baixa, media, alta)
Botoes:
- Voltar
- Proximo

------------------------------------------------------------
3.5 Cotacao Passo 3 Budget Periodo Regiao
------------------------------------------------------------

Campos:
- Budget total em reais
- Data de inicio
- Data de termino
- Regiao (nacional, estado, cidade, raio)
- Campo opcional para mix manual (percentuais por canal)
Botoes:
- Voltar
- Proximo

------------------------------------------------------------
3.6 Cotacao Passo 4 Resultado IA Ajustes
------------------------------------------------------------

Elementos:
- Resumo executivo gerado pela IA
- Tabela de midia contendo canais, modelos, precos, percentuais de budget, estimativas
- Alertas de margem minima, piso, teto, inconsistencias
- Opcoes para editar precos e mix
Botoes:
- Gerar PDF
- Salvar rascunho
- Voltar

------------------------------------------------------------
3.7 Tela de Administracao de Regras de Preco
------------------------------------------------------------

Elementos:
- Campo para CPM base programatico (equivalente ao D3)
- Campos para precos fixos e condicionais de display, video, ctv, audio e social
- Campos para margens minimas
- Campos para pisos e tetos
Botao:
- Salvar configuracoes

------------------------------------------------------------
3.8 Tela de Relatorios
------------------------------------------------------------

Elementos:
- Numero de cotacoes por periodo
- Margem media por canal
- Comparacao preco sugerido vs preco praticado
- Top clientes por volume
- Exportacao CSV

============================================================
4. COMPONENTES UI REUTILIZAVEIS
============================================================

- CampoPadrao
- CampoNumero
- Dropdown
- PassoWizard
- TabelaPrecos
- CelulaEditavel
- AvisoRegra
- BotaoPrimario
- BotaoSecundario
- TagDeStatus
- BoxDeExplicacaoIA
- ComponentePDF

============================================================
5. IDENTIDADE VISUAL
============================================================

Paleta base sugestiva:
- Azul primario: 2E5FF2
- Azul escuro: 1B2F59
- Branco: FFFFFF
- Cinza leve: F2F2F4

Tipografia:
- Inter ou SF Pro

Estilo:
- Layout limpo, moderno, com contraste visual claro
- Botoes com cantos arredondados e sombra leve