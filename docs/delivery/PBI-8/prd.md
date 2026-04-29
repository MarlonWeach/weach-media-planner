# PRD - PBI-8: Precificação de Performance (Guarda-chuva)

## Contexto
A precificação de performance depende de avaliação manual caso a caso, considerando variáveis comerciais e de mercado difíceis de traduzir em regra rígida no curto prazo.

## Problema
Hoje o fluxo operacional acontece por e-mail, sem padronização no sistema para disparo, acompanhamento e captura estruturada do racional de precificação.

## Objetivo
Estruturar o processo em duas frentes:

- `PBI-8A`: orquestrar envio e acompanhamento de cotações por e-mail (com operação humana).
- `PBI-8B`: construir base histórica estruturada para aprendizado futuro por IA.

## Desmembramento

### PBI-8A - Workflow de Cotação por E-mail
- Disparar e-mails de cotação para fluxo operacional e validação.
- Incluir destinatário principal, cópias internas e solicitante.
- Padronizar template com resumo do briefing e dados da cotação.
- Registrar status e trilha de envio/resposta.

### PBI-8B - Base Histórica para IA de Performance
- Definir modelo de dados para variáveis de briefing e racional humano.
- Salvar decisão de preço final e critérios aplicados.
- Permitir evolução incremental do histórico para uso futuro por IA.

## Fora de Escopo (nesta fase)
- Automatização total da precificação de performance.
- Decisão automática de preço sem validação humana.
- Modelo preditivo final em produção.

## Métricas de Sucesso
- 100% das cotações de performance com disparo de e-mail auditável.
- Redução do retrabalho operacional no fluxo de análise por e-mail.
- Crescimento contínuo da base histórica com racional de preço registrado.
