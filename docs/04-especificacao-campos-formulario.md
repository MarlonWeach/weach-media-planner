# Especificação dos Campos do Formulário da Cotação

---

Este documento lista todos os campos necessários no formulário da ferramenta, combinando:

- O formulário comercial existente (PDF enviado)
- Inclusões adicionais recomendadas para IA
- Validações
- Tipagem
- Exemplos de uso

---

# 1. Dados Gerais da Campanha

## 1.1. Nome da campanha
- **Tipo:** texto
- **Ex:** “Lançamento SUV 2025”

## 1.2. Segmento do cliente
- Automotivo  
- Financeiro  
- Varejo Moda  
- Educação  
- Saúde  
- Telecom  
- Imobiliário  
- Serviços  
- Tecnologia  
- Outros

Validação: obrigatório.

## 1.3. Objetivo da campanha
- Awareness
- Consideração
- Performance
- Leads
- Vendas diretas

Validação: obrigatório.

---

# 2. Informações do Cliente

## 2.1. Nome do cliente/anunciante  
- Texto

## 2.2. URL da landing page  
- Texto  
- Validação: deve conter http/https

## 2.3. Maturidade digital
- Baixa (não tem pixel/CRM)
- Média (pixel instalado, campanhas esporádicas)
- Alta (opera mídia, tem CRM, tem tracking alinhado)

---

# 3. Dados de Período e Região

## 3.1. Data de início
- Datepicker

## 3.2. Data de término
- Datepicker

## 3.3. Região / Geo
- Nacional  
- Estado  
- Cidade  
- Raio (km)

Validação: obrigatório.

---

# 4. Orçamento e Modelos

## 4.1. Budget total
- Número (R$)
- Validação:
  - mínimo R$ 1.000
  - máximo configurável

## 4.2. Tipo de mídia desejada
- Display
- Vídeo
- CTV
- Native
- Social
- CRM media (WhatsApp/SMS/Push)
- In Live
- **Ou:** “Sugerir automaticamente”

---

# 5. Dados do Mix (se usuário quiser definir)
- Percentual por canal
- Campo opcional
- Validação: soma 100%

---

# 6. Entradas que ajudam a IA

## 6.1. Tolerância a risco do cliente
- Baixa
- Média
- Alta

## 6.2. Histórico de campanhas anteriores
- Sim / Não
- Se sim, abre campo “descrição”

## 6.3. Aceita modelos híbridos (CPC + CPL)?
- Sim / Não

## 6.4. Prioridade da campanha
- Mais leads
- Melhor preço
- Melhor alcance
- Brand safety máximo
- Inventário premium

---

# 7. Observações gerais
Campo texto livre.

---

# 8. Campos herdados do formulário em PDF
Baseado no documento anexado, foram incluídos:

- Tipo de inventário da Weach solicitado  
- Informações específicas de formatos  
- Observações comerciais  
- Informações do vendedor

(Os demais campos já foram absorvidos pelas categorias acima.)

---

# 9. Estrutura final do formulário
A ferramenta será um fluxo de 4 passos:

### **Passo 1 — Dados do cliente**
### **Passo 2 — Segmento, objetivo, maturidade**
### **Passo 3 — Budget, período, região**
### **Passo 4 — Mídias desejadas + observações**

Com botão final:

> **Gerar Plano de Mídia + Preços Sugeridos**