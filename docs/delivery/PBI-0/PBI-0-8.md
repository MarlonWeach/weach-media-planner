# Task 0-8: Configurar regra de recap automático após 1h de inatividade

## Status
✅ Done

## Descrição
Criar uma regra de comportamento do agente no Cursor para que, quando houver intervalo superior a 1 hora entre mensagens, a resposta inicie com um resumo muito breve do contexto recente.

## Objetivo
Reduzir perda de contexto após pausas longas de trabalho, mantendo continuidade com baixo ruído.

## Escopo
- Adicionar regra em arquivo separado dentro de `.cursor/rules/`.
- Garantir compatibilidade com regras atuais e futuras.
- Evitar mudanças em regras existentes.

## Requisitos Funcionais
1. Detectar, por contexto da conversa, inatividade maior que 60 minutos.
2. Incluir recap curto no início da resposta quando a condição for atendida.
3. Limitar recap a itens essenciais (objetivo, progresso, pendências, próximo passo).
4. Evitar recap quando o intervalo for menor que 60 minutos.

## Critérios de Aceite
- [x] Regra criada em arquivo dedicado (`.mdc`) sem sobrescrever outras regras.
- [x] Regra definida como `alwaysApply` para funcionar em toda sessão.
- [x] Recap condicionado explicitamente a intervalo maior que 1 hora.
- [x] Conteúdo do recap definido como breve e objetivo.

## Dependências
- Nenhuma.

## Arquivos Esperados
- `.cursor/rules/session-recap-after-1h.mdc`
