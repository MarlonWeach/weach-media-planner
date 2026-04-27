# Requisitos Funcionais — Weach Pricing & Media Recommender

## 1. Introdução
Este documento especifica todos os requisitos funcionais do sistema “Weach Pricing & Media Recommender”, responsável por gerar automaticamente sugestões de plano de mídia, estimativas, preços e racional estratégico, a partir de inputs fornecidos pelo usuário (interno ou externo).

---

# 2. Perfis de Usuário

## 2.1. Usuário Interno (Comercial / Planejamento)
- Criar cotações completas
- Obter preços sugeridos
- Gerar PDFs comerciais
- Ver histórico de cotações
- Editar preços dentro de limites permitidos
- Criar propostas personalizadas
- Exportar para operação
- Acessar dados confidenciais de pricing

## 2.2. Usuário Externo (Simulador Público)
- Inserir informações básicas da campanha
- Obter estimativa simplificada
- Receber range aproximado de custos
- Solicitar contato com área comercial

## 2.3. Gestor / Admin
- Gerenciar regras de preço
- Criar tabelas mestre de pricing
- Configurar margens mínimas
- Ver relatórios de cotações e performance
- Criar usuários e permissões

---

# 3. Requisitos Funcionais (RF)

## RF01 — Cadastro de cotação
O sistema deve permitir que o usuário cadastre uma nova cotação informando:
- Segmento
- Período
- Região
- Site/URL
- Budget
- Objetivo da campanha
- Tipo de mídia desejada ou “automática”
- Informações complementares

## RF02 — Sugestão automática de mix de mídia
O sistema deve gerar automaticamente:
- Mix de canais recomendado  
- Percentual de distribuição do budget  
- Formatos recomendados por canal  
- Modelos de compra (CPM, CPC, CPV, CPL/CPA)

## RF03 — Sugestão de preços automáticos
O sistema deve sugerir um valor de preço por:
- Canal  
- Formato  
- Modelo de compra  

Com base em:
- Regras internas
- Segmento
- Região
- Objetivo
- Histórico

## RF04 — Ajuste manual com validação
O vendedor pode ajustar preços manuais dentro de limites definidos pelo gestor:
- Margem mínima
- Preço mínimo
- Preço máximo
- Tolerância configurável

## RF05 — Geração automática de PDF comercial
O sistema deve:
- Criar PDF com branding Weach
- Listar mix sugerido
- Incluir valores e estimativas
- Incluir texto explicativo gerado por IA
- Incluir dados do vendedor

## RF06 — Geração automática de estimativas
O sistema deve calcular:
- Impressões estimadas
- Alcance estimado
- Cliques estimados
- Leads estimados
- CPC/CPM/CPV/CPL/CPA estimados

## RF07 — Modo Simulador Público
O sistema deve oferecer:
- Versão básica no site
- Campos reduzidos
- Estimativas genéricas
- Preços aproximados
- CTA para contato comercial

## RF08 — Histórico de cotações
Registrar:
- Inputs do usuário
- Mix sugerido
- Preços sugeridos
- Preços ajustados manualmente
- PDFs gerados
- Vendedor responsável

## RF09 — Governança de preços
- Admin define pisos e tetos
- Sistema bloqueia valores inválidos
- Logs de alterações

## RF10 — Dashboard interno
- Nº de cotações por vendedor
- Margem média
- Preço médio por canal
- Taxa de aceite

## RF11 — Exportação para operação
Gerar nota técnica com:
- Mix aprovado
- Budget
- Detalhes de mídia
- Prazos
- Observações

## RF12 — Login e permissões
- Nível comercial  
- Nível gestor  
- Nível externo (simulador)  
- Auditoria de acessos

---

# 4. Restrições
- Não permitir acesso externo a tabelas com preços internos
- PDFs gerados precisam seguir identidade visual Weach
- Permitir diferentes políticas de preço por segmento

---

# 5. Regras de Negócio Relacionadas (Resumo)
Ver documento: **05-regras-de-negocio-pricing.md**