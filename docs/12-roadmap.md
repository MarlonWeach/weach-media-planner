# Roadmap Oficial do Projeto
Weach Pricing and Media Recommender

Este documento define as fases de implementação do sistema, entregáveis, prioridades, dependências e visão de evolução incremental. Todo o roadmap é organizado para desenvolvimento real no Cursor, com entregas curtas, claras e versionáveis.

============================================================
1. OBJETIVOS DO ROADMAP
============================================================

- Criar o MVP mais rápido possível, mas sólido e escalável.
- Garantir governança rígida no núcleo de precificação.
- Garantir que a IA não interfira no motor determinístico.
- Evoluir gradualmente a power features (relatórios, integrações, histórico).
- Permitir que o projeto cresça sem reescrever a base.

============================================================
2. FASE 0 — PREPARAÇÃO (1 a 2 dias)
============================================================

Entregáveis:
- Repositório criado (GitHub).
- Configuração inicial do Cursor com regras e docs.
- Setup de ambiente:
  - Next.js
  - Typescript
  - Tailwind
  - Shadcn UI
  - Supabase com banco inicial
  - Prisma configurado
- Configurar autenticação (Supabase Auth ou NextAuth).
- Criar estrutura de pastas conforme documentação.

Resultado:
Sistema vazio porém com base sólida para começar.

============================================================
3. FASE 1 — MVP FUNCIONAL (7 a 10 dias)
============================================================

Objetivo:
Ter um sistema capaz de criar uma cotação end-to-end com preços reais.

Entregáveis principais:

------------------------------------------------------------
3.1 Backend e Core
------------------------------------------------------------
- Implementar motor determinístico:
  - CPM base programático (D3)
  - Fórmulas de Display, Vídeo, CTV, Áudio e Social
  - Cálculo de cenários por budget (descontos)
  - Aplicação de pisos, tetos e margens
- Criar rotas de API:
  - /api/cotacao/criar
  - /api/cotacao/{id}
  - /api/pricing/calcular
- Criar modelo Prisma:
  - usuarios
  - cotacoes
  - precos_base
  - historico_ia
  - log_alteracoes_preco

------------------------------------------------------------
3.2 Frontend
------------------------------------------------------------
- Criar wizard de cotação em 4 passos.
- Criar dashboard inicial.
- Criar tabela dinâmica de preços e estimativas.
- Criar validações de margem e governança.

------------------------------------------------------------
3.3 IA
------------------------------------------------------------
- Configurar prompts básicos:
  - geração de mix
  - explicação comercial
  - validação
- Criar camada de logs em HistoricoIA.

------------------------------------------------------------
3.4 Geração de PDF
------------------------------------------------------------
- Criar documento com:
  - resumo executivo
  - plano de mídia
  - estimativas
  - identidade visual da Weach

Resultado da Fase 1:
MVP funcional capaz de gerar uma cotação completa.

============================================================
4. FASE 2 — ADMIN E REGRAS DE PREÇO (5 a 7 dias)
============================================================

Objetivo:
Criar módulo Admin para controlar regras, preços, pisos e tetos.

Entregáveis:
- Tela de login com roles
- Painel Admin com:
  - edição de CPM base (D3)
  - tabela de valores fixos
  - tabelas condicionais (FB, CTV, etc.)
  - margens mínimas
  - pisos e tetos
- Auditoria de alterações:
  - LogAlteracoesPreco
- Forçar comercial a trabalhar sempre dentro das regras.

Resultado da Fase 2:
Governança completa de preços.

============================================================
5. FASE 3 — RELATÓRIOS E DASHBOARD (5 dias)
============================================================

Objetivo:
Transformar dados em inteligência interna.

Entregáveis:
- Painel de relatórios:
  - número de cotações por período
  - segmentos mais ativos
  - mix médio por segmento
  - desvio entre preços sugeridos e praticados
- Exportação CSV

Resultado:
Time comercial passa a ter visão estratégica completa.

============================================================
6. FASE 4 — SIMULADOR PÚBLICO (7 dias)
============================================================

Objetivo:
Gerar leads automaticamente através de uma página pública.

Entregáveis:
- Página /simulador
- Formulário simplificado
- Lógica de estimativa leve (não sensível)
- Conversão do usuário em lead
- Envio automático de resumo via e-mail

Resultado:
Canal de aquisição de leads para a Weach.

============================================================
7. FASE 5 — HISTÓRICO INTELIGENTE (IA 2.0) (10 a 14 dias)
============================================================

Objetivo:
Melhorar qualidade das recomendações da IA com base no que funciona.

Entregáveis:
- Sistema de “aprendizado observacional”:
  - leituras das cotações aprovadas
  - identificação de mix vencedor por segmento
  - identificação de precificação vencedora por canal
- Ajustes sugeridos pelo planner com base em histórico
- Insights automáticos (“Para campanhas de varejo, vídeo tem aceitação maior…”)

Resultado:
IA passa a recomendar com base no que funciona na prática.

============================================================
8. FASE 6 — INTEGRAÇÕES DE MÍDIA (avançado)
============================================================

Objetivo:
Criar ponte com plataformas externas.

Possíveis integrações:
- Meta Ads API (verificar leads)
- DV360 (importação de volumes)
- CAKE (leads e pós-clique)
- Google Sheets export API

Resultado:
Plataforma passa a operar integrada ao ecossistema.

============================================================
9. FASE 7 — API PÚBLICA (opcional)
============================================================

Objetivo:
Transformar o mecanismo de estimativa em produto externo.

Entregáveis:
- Autorização via tokens
- Rota pública de simulação
- Limites de rate
- Logs de auditoria por cliente

============================================================
10. PRIORIDADES (KANBAN SUGERIDO)
============================================================

To Do:
- Motor determinístico v1
- Wizard cotação v1
- Chamadas IA
- PDF básico

Doing:
- Governança de preços
- Ajustes de tela

Done:
- Setup base
- Autenticação
- Estrutura de pastas

============================================================
11. RISCOS E MITIGAÇÕES
============================================================

Risco: IA sugerir valores fora das regras  
Mitigação: motor determinístico sempre prevalece.

Risco: reajuste manual quebrar margem  
Mitigação: regras rígidas de piso, teto e margem mínima.

Risco: crescimento de escopo  
Mitigação: roadmap incremental com entregas pequenas.

============================================================
12. RESUMO FINAL DO ROADMAP
============================================================

- Fase 1: MVP funcional  
- Fase 2: Governança  
- Fase 3: Relatórios  
- Fase 4: Simulador público  
- Fase 5: IA 2.0  
- Fase 6: Integrações  
- Fase 7: API pública  

Estratégia:
Começar pequeno, com núcleo determinístico forte, e evoluir com IA e integrações.