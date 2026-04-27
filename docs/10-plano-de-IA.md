# Plano de IA
Weach Pricing and Media Recommender

Este documento descreve como a inteligencia artificial deve atuar no projeto, qual o escopo de responsabilidade da IA, como interage com o motor deterministico de precificacao e quais sao as regras de seguranca e governanca.

============================================================
1. OBJETIVOS DA IA
============================================================

A IA deve realizar as seguintes funcoes estrategicas:

1. Gerar um plano de midia recomendado.
2. Distribuir o budget entre canais adequados.
3. Criar um texto comercial explicativo (resumo executivo).
4. Apontar inconsistencias ou riscos na estrutura da cotacao.
5. Ajudar o usuario a entender porque cada canal foi escolhido.
6. Adaptar seu comportamento ao historico de cotacoes aprovadas.
7. Sugerir ajustes sutis (nao deterministicos) dentro das regras.

A IA NAO deve definir precos nem margens.  
Esses valores sao calculados apenas pelo motor deterministico baseado nas regras internas da Weach.

============================================================
2. LIMITES DA IA
============================================================

- A IA nao pode:
  - Criar novos canais que nao fazem parte do inventario da Weach.
  - Alterar valores de precos base.
  - Alterar pisos, tetos ou margens minimas.
  - Gerar valores de CPM, CPC, CPV que contradigam as funcoes do sistema.
  - Aprovar ou rejeitar cotacoes.
  - Alterar regras internas de pricing.
  - Ignorar regras obrigatorias (como somatorio de 100% do mix).

============================================================
3. ARQUITETURA DE AGENTES
============================================================

O sistema utiliza tres funcoes principais relacionadas a IA:

------------------------------------------------------------
3.1 Agente Media Planner
------------------------------------------------------------
Funcoes:
- Escolher canais adequados com base no objetivo.
- Distribuir percentual de budget entre canais.
- Ajustar a estrategia conforme maturidade digital, risco e regiao.
- Gerar um mix inicial coerente.

Entrada:
- Segmento
- Objetivo
- Budget
- Maturidade digital
- Regiao
- Preferencias do cliente (quando existirem)

Saida:
- Lista de canais recomendados com percentuais.
- Justificativa preliminar para cada decisao.

------------------------------------------------------------
3.2 Motor Deterministico de Precificacao
------------------------------------------------------------
Este componente NAO utiliza IA.

Responsabilidades:
- Calcular precos por canal usando CPM base D3 e formulas derivadas.
- Aplicar cenarios de desconto conforme faixa de budget.
- Aplicar pisos, tetos e margens minimas.
- Validar consistencia aritmetica dos valores.
- Retornar precos finais por canal.

A IA apenas recebe esses precos prontos.  
Ela nao pode modifica-los.

------------------------------------------------------------
3.3 Agente AI Explainer
------------------------------------------------------------
Funcoes:
- Transformar o plano + precos em texto comercial.
- Esclarecer racional estrategico.
- Explicar porque aquele mix e apropriado.
- Informar beneficios de cada canal escolhido.
- Adaptar linguagem ao estilo comercial Weach.

Exemplo de saida:
"Recomendamos combinar Display e Video para ampliar alcance no topo do funil, enquanto Social e CTV fortalecem frequencia e qualificacao da audiencia."

------------------------------------------------------------
3.4 Agente AI Validator
------------------------------------------------------------
Funcoes:
- Verificar incoerencias no plano ou no mix.
- Apontar problemas como:
  - mix nao soma 100%
  - canal subutilizado ou superestimado
  - estrategia desalinhada ao objetivo
  - distribuicao de budget incoerente com tamanho da regiao
- Emitir avisos, nao erros.

============================================================
4. FLUXO COMPLETO DE EXECUCAO DA IA
============================================================

Fluxo resumido:

1. Usuario preenche formulario da cotacao.
2. Sistema interpreta objetivo, segmento, budget e maturidade.
3. Agente Media Planner gera um mix inicial.
4. Pricing Engine (deterministico) calcula precos reais usando:
   - CPM base programatico
   - formulas da planilha (D3, E9, D12 etc)
   - cenarios por budget
   - pisos e tetos
5. IA Validator revisa coerencia do plano.
6. IA Explainer cria texto comercial.
7. Sistema monta:
   - Tabela de midia
   - Resumo executivo
   - Estimativas
8. Sistema gera PDF.

============================================================
5. ESTRUTURA DE PROMPTS
============================================================

Os prompts devem ser armazenados em arquivos separados (ver pasta /prompts) e conter:

- Prompt para geracao de plano (mix)
- Prompt para explicacao comercial
- Prompt para validacao de consistencia
- Prompt para resumo executivo

Prompts devem conter:
- Regras claras do que a IA pode e nao pode fazer
- Formatacao padrao da resposta (sempre em JSON ou texto simples)
- Estilos de escrita para resumo executivo (curto, direto, comercial)

============================================================
6. APRENDIZADO CONTINUO (FASE 2)
============================================================

Quando implementado:

- Cada cotacao aprovada e registrada em HistoricoIA.
- O sistema aprende:
  - combinacoes de canais mais aceitas
  - precos que geram maior taxa de aceite
  - estrategias de mix mais eficientes por vertical
- A IA utiliza o historico para:
  - sugerir distribuicoes mais adequadas
  - evitar erros frequentes
  - ajustar tom das explicacoes

Isso NAO altera precos base, apenas orienta a estrategia.

============================================================
7. REGRAS DE SEGURANCA E COMPLIANCE
============================================================

- Todos os prompts enviados a IA devem ser registrados em HistoricoIA.
- Nenhuma informacao sensivel do cliente deve ser enviada ao modelo.
- IA nao envia dados para fora do sistema (somente processa localmente via API).
- IA nao pode sugerir valores de preco.
- IA nao pode substituir regras da Weach.

============================================================
8. PADRAO DE OUTPUT DA IA
============================================================

A IA sempre deve gerar respostas seguindo formatos claros:

------------------------------------------------------------
8.1 Formato para mix em JSON simplificado:
------------------------------------------------------------
{
  "mix": [
    { "canal": "Display", "percentual": 40 },
    { "canal": "Video", "percentual": 30 },
    { "canal": "CTV", "percentual": 20 },
    { "canal": "Social", "percentual": 10 }
  ]
}

------------------------------------------------------------
8.2 Formato para explicacao comercial:
------------------------------------------------------------
Texto simples, direto, de 2 a 4 paragrafos, no estilo comercial Weach.

------------------------------------------------------------
8.3 Formato para validacao:
------------------------------------------------------------
Lista de alertas, nunca bloqueios:
- "O canal CTV recebeu apenas 2% do budget, pode ser insuficiente."
- "O objetivo Leads geralmente se beneficia de maior peso em Social."

============================================================
9. RESUMO GERAL DA FUNCAO DA IA NO PROJETO
============================================================

- A IA guia a estrategia, nao define o preco.
- A IA cria narrativa comercial, nao margens.
- A IA interpreta objetivos do cliente, nao regras contabeis.
- A IA reforca governanca, nao substitui conformidade.
- A IA gera inteligencia e clareza, nao valores financeiros.

O sistema fica mais eficiente, mais rapido e mais consistente, mas sempre respeitando a logica deterministica central definida pela Weach.