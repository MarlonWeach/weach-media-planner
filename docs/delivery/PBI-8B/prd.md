# PRD - PBI-8B: Base Histórica para IA de Performance

## Contexto
A precificação de performance depende de critérios comerciais complexos e experiência acumulada. Hoje esse racional não está estruturado em base histórica adequada para aprendizado de IA.

## Objetivo
Criar uma base de dados histórica com variáveis de briefing, racional humano e preço final aplicado, habilitando aprendizado assistido no futuro.

## Escopo
- Definir modelo de dados para armazenar:
  - variáveis de briefing de performance,
  - contexto da campanha (segmento, região, canal, formato),
  - preço final aprovado e ajustes,
  - racional humano (texto e tags),
  - metadados de autoria e tempo.
- Permitir registro e edição operacional do racional por cotação.
- Disponibilizar consultas básicas para análise histórica.
- Preparar dados para etapa futura de IA recomendadora (assistiva).

## Fora de Escopo
- IA autônoma aprovando preço sem revisão humana.
- Modelo preditivo em produção.

## Métricas de Sucesso
- Crescimento contínuo do histórico com racional completo por cotação de performance.
- Redução de dependência de memória individual para decisões futuras.
- Disponibilidade de dataset consistente para fase de recomendação por IA.
