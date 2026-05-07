# Task 9-1: Definir padrão final do ID operacional e regra de formatação

## Status
✅ Done

## Descrição
Definir formalmente o padrão de ID único operacional para o sistema, preservando a lógica do processo atual baseado no `Response Number` do Google Form e garantindo continuidade da sequência durante a convivência e após o go-live.

## Objetivo
Ter uma regra única, simples e auditável para ID de cotação, evitando duplicidade e quebra de sequência na transição Google Form -> sistema.

## Padrão Definido

### Chave de sequência (fonte de verdade)
- O número sequencial será mantido como inteiro no banco (`numeroSequencial`).
- Esse número será único e crescente, sem reutilização.
- A geração ocorre por incremento transacional (atômico), com bloqueio de concorrência.

### Formato do ID operacional
- O ID operacional seguirá o mesmo padrão do legado baseado em `Response Number`: **numérico sequencial**.
- Exibição padrão: `numeroSequencial` puro (ex.: `152`, `153`, `154`).
- Quando necessário para UI/relatório, pode existir máscara visual com zero à esquerda (ex.: `000152`), sem alterar o valor base.

### Regra de continuidade na convivência
- Antes da ativação, o contador interno será inicializado (`seed`) com o último número válido já usado no processo atual.
- A próxima cotação criada no sistema usa `ultimoNumero + 1`.
- O Google Form continua ativo durante a convivência, porém a sequência oficial para o sistema permanece controlada pelo contador interno para evitar colisões.

### Regra de virada de chave (go-live)
- No go-live, o Google Form é desligado.
- A sequência do sistema continua do número atual, sem reset.

## Critérios de Aceite
- [x] Existe definição escrita da estrutura `numeroSequencial` e da regra de unicidade.
- [x] Existe definição de formato de exibição do ID operacional.
- [x] Existe regra documentada para seed inicial com o último número legado.
- [x] Existe regra documentada de continuidade da sequência no go-live.

## Decisões
- Escolha por padrão numérico simples para manter aderência ao `Response Number` legado e reduzir complexidade operacional.
- Máscara visual (zero à esquerda) fica opcional e somente de apresentação.
