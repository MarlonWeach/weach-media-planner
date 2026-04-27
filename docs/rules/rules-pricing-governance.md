# Rules — Pricing Governance
Weach Pricing and Media Recommender

Este documento governa como regras de preço devem funcionar, quem pode modificá-las e como a camada determinística interage com o sistema.

============================================================
1. PRINCÍPIOS DE GOVERNANÇA
============================================================

- A precificação é 100% determinística.
- A IA não interfere em preços.
- Apenas regras e tabelas podem definir valores.
- Toda alteração deve ser auditável.
- Nenhum preço pode depender de intuição do usuário.

============================================================
2. QUEM PODE ALTERAR PREÇOS
============================================================

- Apenas admin pode alterar:
  - CPM base programático (D3)
  - valores fixos (ex: Spotify Overlay)
  - tabelas condicionais (FB, CTV, etc)
  - pisos e tetos
  - margens mínimas

- Comercial NÃO pode alterar:
  - valores base
  - regras de cálculo

- Comercial pode:
  - ajustar mix (%)
  - ajustar valores dentro da faixa permitida (piso → teto)

============================================================
3. PISOS, TETOS E MARGENS
============================================================

Cada canal ou formato deve ter:
- piso de preço
- preço alvo (referência)
- teto de preço
- margem mínima obrigatória

O sistema deve:
- bloquear valores fora da faixa
- avisar quando a margem mínima não é atendida
- registrar qualquer tentativa de alteração em log

============================================================
4. MOTOR DETERMINÍSTICO (CORE)
============================================================

O motor deve aplicar:

- CPM base D3
- derivação de CPVs
- derivação de CPCs
- regras condicionais por cpmbase
- cenários de desconto por budget
- ajustes regionais
- margens mínimas
- tetos e pisos

Formato:
- Função pura
- Totalmente replicável
- Não depende de IA

============================================================
5. REGRAS DE CÁLCULO OBRIGATÓRIAS
============================================================

- Nenhum cálculo deve ser feito no frontend.
- Nenhum cálculo pode ser sobrescrito manualmente.
- Toda lógica deve estar em um único módulo fonte.

============================================================
6. AUDITORIA E LOGS
============================================================

Sempre registrar:

- quem alterou preço base
- quando alterou
- motivo da alteração
- antes e depois

Para cotações:
- registrar cada alteração realizada pelo comercial
- registrar violações de margem
- registrar inconsistências detectadas

============================================================
7. INTEGRIDADE DOS DADOS
============================================================

- Uma tabela oficial de preços base deve existir no banco.
- Preços não podem ser carregados parcialmente.
- Mudanças devem criar nova versão, nunca sobrescrever sem registro.

============================================================
8. RELAÇÃO COM IA
============================================================

- IA nunca pode citar:
  - fórmulas
  - margens
  - pisos, tetos
  - tabelas internas

- IA só recebe valores finais e explica o racional de mídia.

============================================================
9. EXCEÇÕES
============================================================

- Apenas admin pode aprovar exceções de preço.
- Exceções devem gerar registro explícito.
- O sistema deve exibir aviso: “Este valor requer aprovação administrativa”.

============================================================
10. CONCLUSÃO
============================================================

O sistema de pricing da Weach é rigoroso, auditável e matematicamente preciso.  
Toda IA e todo comercial trabalham dentro dessas regras, jamais fora delas.