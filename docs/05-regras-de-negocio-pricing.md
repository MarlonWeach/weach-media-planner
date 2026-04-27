# Regras de Negócio de Pricing — Weach Pricing & Media Recommender

---

## 1. Introdução
Este documento define todas as regras internas que determinam como o sistema sugere preços e distribuições de budget.  
Inclui:  
- Lógicas de precificação  
- Pisos e tetos  
- Margens mínimas  
- Multiplicadores  
- Condições especiais por segmento  
- Bloqueios e validações

---

# 2. Estrutura Geral de Pricing

O pricing é determinado pela combinação de:

1. **Produto / Canal**
   - Display
   - Vídeo
   - CTV
   - Native
   - CRM Media (WhatsApp, SMS, Push)
   - Social (via inventário programático)
   - In Live

2. **Formato**
   - Banner
   - Vídeo 6s / 15s / 30s
   - CTV 15s / 30s
   - Carrossel
   - Interstitial
   - Push / WhatsApp / SMS
   - Native feed

3. **Modelo de compra**
   - CPM
   - CPC
   - CPV
   - CPL
   - CPA
   - Modelos híbridos (CPC + CPL)

4. **Segmento**
   - Automotivo
   - Financeiro
   - Varejo
   - Saúde
   - Telecom
   - Educação
   - Imobiliário
   - Outros

5. **Região**
   - Nacional
   - Sudeste
   - SP Capital
   - Nordeste
   - etc.

6. **Objetivo**
   - Awareness
   - Consideração
   - Leads
   - Vendas

---

# 3. Regras de Preço por Canal (Genéricas)

## 3.1. Display
- CPM base: variável por segmento  
- Multiplicadores:
  - +15% para SP capital
  - +10% para inventário premium
- Para performance (CPC):
  - CPC sugerido = CPM ÷ (CTR médio de referência)

## 3.2. Vídeo
- CPV depende do segmento
- CPM vídeo tende a ser maior que display
- Canais premium: +20%

## 3.3. CTV
- CTV sempre precificado por CPM
- Multiplicador de região:
  - SP: +20%
  - Regiões menores: -10%
- Volume mínimo obrigatório por flight

## 3.4. Native
- CPM competitivo
- CTR mais alto tende a puxar CPC sugerido para baixo

## 3.5. CRM Media (WhatsApp/SMS/Push)
- CPD (custo por disparo)  
- CPD = Custo base + variável por região
- Multiplicador para segmentações premium

## 3.6. In Live
- Eventos podem ter CPM fixo ou pacote fechado
- Preço depende do inventário do parceiro

---

# 4. Regras Baseadas no Segmento

## Automotivo
- CPC tende a ser mais alto  
- CPL mínimo histórico deve ser respeitado
- Para leads/test drive:
  - Mínimo CPL → regra obrigatória

## Financeiro
- Regras rígidas de brand safety  
- Multiplicador +15% para inventário seguro  
- CPC e CPL mais altos

## Varejo
- CPM mais baixo possível  
- Campanhas normalmente de alta frequência

## Imobiliário
- CPC pode ser alto com baixa conversão  
- CTV normalmente recomendado

---

# 5. Regras de Margem

## 5.1. Margem mínima
- Cada canal possui margem mínima obrigatória (configurável):
  - Display: ex. 25%
  - Vídeo: ex. 20%
  - CTV: ex. 15%
  - Native: ex. 25%
  - CRM: 20%
  - Social (via programático): 15%

## 5.2. Se usuário tentar colocar preço abaixo da margem mínima:
- Sistema bloqueia e exibe aviso:
  > “Este valor viola as políticas de margem da Weach. Ajuste necessário.”

---

# 6. Política de Pisos e Tetos

Cada canal possui:

- **Preço mínimo (piso)**  
- **Preço recomendado (alvo)**  
- **Preço máximo (teto)**  

Se usuário alterar manualmente:
- Abaixo do piso → bloqueado  
- Entre piso e teto → liberado  
- Acima do teto → exige justificativa para gestor  
- Com margem < margem mínima → requer aprovação

---

# 7. Multiplicadores regionais

| Região | Multiplicador |
|--------|---------------|
| SP Capital | +20% |
| Sudeste | +10% |
| Sul | neutro |
| Nordeste | -10% |
| Cidades < 300k habitantes | -15% |

---

# 8. Regras de IA para precificação

A IA deve considerar:

- Segmento  
- Região  
- Objetivo  
- Maturidade digital  
- Histórico com a Weach  
- Preço médio praticado anteriormente  
- Média de CTR/CPV/CPL por vertical  

IA justifica:
- Por que sugeriu aquele preço  
- Por que recomendou aquele mix  
- Diferenças em relação a cotações anteriores  

---

# 9. Regras de Exportação

PDF deve conter:
- Preços sugeridos  
- Mix recomendado  
- Tabela de estimativas  
- Assinatura do vendedor  
- Branding Weach  