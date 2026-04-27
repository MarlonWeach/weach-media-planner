# Fluxos de Usuário — Weach Pricing & Media Recommender

---

Este documento descreve os principais fluxos de uso do sistema, organizados por tipo de usuário:

- Comercial (interno)
- Gestor/Admin (interno)
- Usuário Externo (simulador público)
- Operação (time que executa campanhas)

---

## 1. Fluxo — Usuário Interno (Comercial)

### Objetivo
Criar uma cotação completa com plano de mídia e preços sugeridos, gerar PDF e registrar histórico.

### Passo a passo

1. **Login**
   - Usuário acessa a aplicação e entra com e-mail + senha.
   - Sistema valida credenciais e identifica o perfil como “comercial”.

2. **Dashboard**
   - Visualiza:
     - Suas últimas cotações
     - Botão “Criar nova cotação”
     - Atalhos para filtrar cotações por status.

3. **Criar nova cotação**
   - Clica em “Nova Cotação”.
   - É direcionado para um fluxo em etapas (wizard).

4. **Passo 1 — Dados do Cliente**
   - Preenche:
     - Nome do cliente/anunciante
     - Segmento
     - URL da landing page
     - Observações iniciais (opcional).

5. **Passo 2 — Objetivo e Maturidade**
   - Seleciona objetivo (awareness / consideração / leads / vendas).
   - Seleciona maturidade digital (baixa / média / alta).
   - Informa se aceita modelo híbrido (CPC + CPL, etc.).
   - Define tolerância a risco (baixa / média / alta).

6. **Passo 3 — Orçamento, Período e Região**
   - Define budget total.
   - Define data de início e fim.
   - Define região (nacional, estado, cidade, raio).
   - Opcionalmente, indica algum mix desejado (ex.: “quero CTV + Display”).

7. **Passo 4 — Geração automática do plano**
   - Clica em “Gerar Plano Automático”.
   - Backend consulta:
     - Tabelas de preço base
     - Regras de negócio
     - Histórico (quando já existir)
   - IA monta:
     - Mix de canais
     - Distribuição de budget
     - Preços sugeridos por canal/modelo
     - Estimativas de entrega
     - Texto explicativo (racional estratégico).

8. **Revisão pelo comercial**
   - Usuário vê tela com:
     - Tabela de canais, formatos, preços, budget, estimativas.
     - Texto de resumo executivo.
   - Pode:
     - Ajustar mix (percentuais, inclusão/remoção de canais).
     - Ajustar preços dentro de faixa permitida.

9. **Validação de regras**
   - Ao ajustar preços, o sistema verifica:
     - Pisos e tetos.
     - Margem mínima.
   - Se violar:
     - Bloqueia e exibe mensagem de erro.
   - Se exigir aprovação:
     - Marca a cotação com status “aguardando aprovação”.

10. **Geração de PDF**
    - Quando finalizado, usuário clica em “Gerar PDF”.
    - Sistema gera documento com:
      - Logo / branding Weach.
      - Resumo executivo.
      - Tabela de plano de mídia.
      - Investimentos e estimativas.
      - Dados de contato do vendedor.

11. **Envio ao cliente & histórico**
    - Comercial pode:
      - Baixar o PDF.
      - Copiar link.
    - Cotação é salva com status “enviada”.
    - Registro entra no histórico do usuário.

---

## 2. Fluxo — Usuário Externo (Simulador Público)

### Objetivo
Permitir que prospects façam uma simulação rápida e se tornem leads para o comercial.

### Passo a passo

1. **Acesso à página pública**
   - Usuário entra em uma URL tipo: `/simulador-midias` no site da Weach.

2. **Formulário simplificado**
   - Campos típicos:
     - Segmento do negócio.
     - Região de atuação.
     - Budget mensal desejado.
     - Objetivo principal (ex.: gerar leads, aumentar visitas ao site).
     - E-mail e telefone (para contato).

3. **Simulação**
   - Ao clicar em “Simular plano”:
     - Sistema usa regras simplificadas de pricing (sem mostrar valores internos sensíveis).
     - Gera:
       - Mix básico de canais.
       - Range aproximado de custo por modelo (CPM / CPC / CPL).
       - Estimativas de impressões, cliques, leads, em valores aproximados.

4. **Exibição de resultado**
   - Usuário vê:
     - “Para o seu segmento e budget, recomendamos…”
     - Gráfico/visual simples de distribuição de budget.
   - Destaque para um CTA:
     - “Receber uma proposta detalhada da Weach”.

5. **Conversão em lead**
   - Os dados do usuário são enviados para:
     - CRM / Hub interno.
     - Time comercial responsável.
   - Opcional:
     - E-mail automático para o lead com resumo da simulação.

---

## 3. Fluxo — Gestor / Admin

### Objetivo
Configurar regras, tabelas de preços, margens e acompanhar relatórios.

### Passo a passo

1. **Login**
   - Gestor acessa a área restrita.
   - Role = “admin”.

2. **Dashboard de gestão**
   - Vê:
     - Número de cotações por período.
     - Margens médias.
     - Canais mais usados.
     - Taxa de aceite das propostas.

3. **Gestão de regras de pricing**
   - Navega para módulo de “Regras / Tabelas de Preço”.
   - Pode:
     - Atualizar preços base (piso, alvo, teto).
     - Atualizar multiplicadores regionais.
     - Configurar margens mínimas por canal/produto.
   - Ao salvar:
     - Sistema versiona regra.
     - Não perde histórico anterior.

4. **Gestão de usuários**
   - Pode:
     - Criar usuários.
     - Definir roles (comercial, admin, externo).
     - Ativar/desativar contas.

5. **Relatórios**
   - Visualiza:
     - Volume de cotações.
     - Desvios de preço (quando comercial força desconto).
     - Canais com menor ou maior margem.
     - Evolução de preços sugeridos vs. aprovados.

---

## 4. Fluxo — Operação (Execução de Campanha)

### Objetivo
Receber o plano aprovado e executá-lo na stack de mídia (DSP, adserver, etc.).

### Passo a passo

1. **Recebe comunicação de cotação aprovada**
   - Via e-mail interno, tarefa no sistema, ou view própria.

2. **Acessa detalhe da cotação**
   - Visualiza:
     - Mix final aprovado.
     - Valores por canal/formato.
     - Período.
     - Observações técnicas.

3. **Exportação para operação**
   - Pode exportar:
     - CSV / XLS.
     - JSON (para integração futura).
   - Ou copiar manualmente as linhas para a ferramenta de mídia (ex.: DV360, Meta, CAKE, etc.).

4. **Mudança de status**
   - Após iniciar setup:
     - Atualiza status da cotação para “em execução” no sistema.
   - Ao final da campanha:
     - Pode ser alterado para “finalizada”.

---

## 5. Mini Diagrama Textual dos Fluxos

Fluxo Comercial (simplificado):

- [Login Comercial]  
  → [Dashboard]  
  → [Nova Cotação]  
  → [Formulário em 4 passos]  
  → [IA gera plano + preços]  
  → [Revisão e ajustes]  
  → [Validação de regras]  
  → [Geração de PDF]  
  → [Envio ao cliente]  
  → [Histórico de cotações]

Fluxo Simulador Público (simplificado):

- [Página pública simulador]  
  → [Form simplificado]  
  → [Simulação básica]  
  → [Resultado + CTA]  
  → [Geração de lead]  
  → [Time comercial entra em contato]

Fluxo Gestor:

- [Login Admin]  
  → [Dashboard de gestão]  
  → [Regras de preço / margens]  
  → [Atualização de tabelas]  
  → [Relatórios / insights]

Fluxo Operação:

- [Cotação aprovada]  
  → [Consulta detalhes]  
  → [Exportação / replicação na stack de mídia]  
  → [Atualização de status]  

---

## 6. Observações

- Estes fluxos podem ser usados diretamente como base para:
  - Definição de rotas em Next.js (páginas e endpoints).
  - Criação de user stories / tasks no desenvolvimento.
  - Desenho de wireframes (arquivo `09-ui-ux-wireframes.md`).