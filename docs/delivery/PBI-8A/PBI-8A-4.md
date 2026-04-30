# Task 8A-4: Integrar disparo de e-mail ao fluxo de criação/atualização de cotação

## Status
✅ Done

## Descrição
Integrar o disparo operacional de e-mail ao fluxo de cotação no momento correto do processo, evitando envio em criação de rascunho e garantindo consistência com status da cotação.

## Objetivo
Garantir que o envio ocorra de forma confiável e auditável no fluxo real de trabalho comercial.

## Escopo desta Task
- Disparar e-mail no endpoint de geração/envio de PDF.
- Evitar envio no momento de criação inicial do rascunho.
- Respeitar regras por definição de campanha.
- Anexar o PDF gerado ao e-mail operacional.
- Atualizar status da cotação para `ENVIADA` após sucesso.

## Critérios de Aceite
- [x] Disparo integrado ao fluxo final de envio (não ao rascunho).
- [x] PDF anexado ao e-mail operacional.
- [x] Regras por tipo de campanha aplicadas.
- [x] Status da cotação atualizado para `ENVIADA` após sucesso.

## Dependências
- `8A-1` concluída.
- `8A-2` concluída.
- `8A-3` concluída.

## Próximas Tasks Relacionadas
- `8A-5`: logging e status operacional detalhado.
