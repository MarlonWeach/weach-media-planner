# Task 8A-3: Implementar template de e-mail com resumo estruturado do briefing/cotação

## Status
🔄 InProgress

## Descrição
Implementar template de e-mail com leitura rápida, no formato de tabela de campos e valores, inspirado no padrão operacional atual recebido por Google Form Notifications.

## Objetivo
Padronizar apresentação das informações da cotação no e-mail para acelerar análise humana e reduzir ruído de interpretação.

## Escopo desta Task
- Template HTML com tabela de duas colunas (campo/valor).
- Assunto com identificação clara do tipo da cotação (performance/programática/híbrida).
- Fallback em texto puro para compatibilidade de clientes de e-mail.
- Inclusão dos campos essenciais de briefing e metadados da cotação.

## Critérios de Aceite
- [ ] E-mail com estrutura visual tabular implementada.
- [ ] Assunto identifica o tipo de cotação e ID.
- [ ] Versão `text/plain` mantém informações principais.
- [ ] Conteúdo seguro com escape de HTML em valores dinâmicos.

## Dependências
- `8A-1` concluída.
- `8A-2` concluída.

## Próximas Tasks Relacionadas
- `8A-5`: logging e status operacional.
