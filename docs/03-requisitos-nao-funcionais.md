# Requisitos Não Funcionais — Weach Pricing & Media Recommender

---

## 1. Performance
- O plano de mídia deve ser gerado em até **3 segundos** após envio do formulário.
- PDFs devem ser gerados em até **5 segundos**.
- Sistema deve suportar **100 cotações simultâneas** sem degradação.

---

## 2. Segurança
- Todos os usuários internos precisam de autenticação.
- Dados de pricing devem ficar restritos a níveis Comercial/Gestor.
- Criptografia dos dados em repouso (AES-256).
- Comunicações HTTPS (TLS 1.2 ou superior).
- Contas externas NÃO podem ver regras internas.

---

## 3. Governança
- Cada alteração de preço deve ser registrada em log:
  - Quem alterou
  - De quanto para quanto
  - Horário
  - Motivo (campo obrigatório)

---

## 4. Confiabilidade
- O sistema deve manter logs por 24 meses.
- Históricos devem ser recuperáveis mesmo que o usuário altere regras futuras.

---

## 5. Usabilidade
- Interface simples com 3–5 passos claros.
- Preenchimento orientado com tooltips.
- Textos automáticos claros e comerciais.
- PDFs legíveis, esteticamente consistentes.

---

## 6. Portabilidade
- Aplicação deve rodar:
  - Navegadores modernos (Chrome, Safari, Firefox)
  - Dispositivos desktop e mobile

---

## 7. Escalabilidade
- Estrutura para suportar expansão futura:
  - Portal de parceiros
  - API pública de estimativas
  - Treinamento incremental via IA

---

## 8. Manutenibilidade
- Código modular separado por:
  - Regras
  - Tabelas
  - Integrações
  - Interface
  - Prompts
  - Modelos IA

---

## 9. Conformidade
- Respeitar LGPD:
  - consentimento explícito
  - retenção mínima de dados
  - rastreabilidade clara