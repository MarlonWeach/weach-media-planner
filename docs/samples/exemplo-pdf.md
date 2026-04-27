# Sample — Estrutura Final de PDF da Proposta

O PDF é composto por seções textuais geradas pela IA + tabelas numéricas do backend.

============================================================
1. ESTRUTURA GERAL
============================================================

1. Capa:
   - Logo Weach
   - Nome do cliente
   - Nome da campanha
   - Período da veiculação

2. Sumário:
   - Objetivo
   - Estratégia
   - Plano de Mídia
   - Estimativas
   - Próximos passos

3. Objetivo da Campanha:
   - Texto gerado pelo prompt de explicação (IA)

4. Estratégia de Mídia:
   - Texto gerado pela IA
   - Breve explicação de cada canal

5. Plano de Mídia (Tabela):
   - Canal
   - Modelo de compra
   - Percentual do budget
   - Preço final (calculado via motor determinístico)
   - Impressões / cliques previstos

6. Estimativas de Resultados:
   - Tabela com projeções
   - Texto introdutório da IA

7. Monitoramento e Otimização:
   - Texto curto da IA explicando acompanhamento

8. Próximos Passos:
   - Assinatura / aprovação
   - Materiais necessários
   - Informações de contato

============================================================
2. ORIENTAÇÃO
============================================================

- A IA monta somente textos.
- Tabelas são responsabilidade do backend.
- O layout do PDF é fixo e controlado pelo template (PDFKit ou React-PDF).