# Task 8A-1: Definir regras de disparo de e-mail por tipo de cotação

## Status
✅ Done

## Descrição
Definir a regra funcional de quando o sistema deve disparar e-mail operacional da cotação, separando comportamento para campanhas de performance e as demais, como programática.

## Contexto de Negócio
A operação comercial atual usa e-mail como canal principal de análise e resposta, especialmente para campanhas de performance. O sistema precisa formalizar esse fluxo sem remover a decisão humana.

## Objetivo
Padronizar as regras de disparo para garantir previsibilidade operacional, rastreabilidade e cobertura dos casos críticos de cotação.

## Regra de Disparo (v1)

### 1) Campanhas de Performance (obrigatório)
- Sempre disparar e-mail operacional ao gerar/atualizar cotação com definição de campanha contendo `PERFORMANCE`.
- O disparo é bloqueante para marcar o envio como concluído no fluxo operacional (com retry em caso de falha).

### 2) Campanhas Programáticas ou WhatsApp / SMS / PUSH (cópia de validação)
- Disparo habilitado por configuração (`EMAIL_PROGRAMATICA_HABILITADO`).
- Valor padrão da v1: `true` (enviar cópia para validação interna).

### 3) Campanhas Híbridas (PERFORMANCE + PROGRAMATICA)
- Tratar como caso de performance: envio obrigatório.
- Assunto/template deve sinalizar claramente que a cotação é híbrida.

### 4) Rascunho vs envio final
- Não disparar em salvamento de rascunho.
- Disparar somente em evento de geração/submissão de cotação pronta para análise comercial.

### 5) Reenvio manual
- Permitir reenvio manual posterior (fora do escopo técnico desta task, mas previsto na regra).
- Reenvio deve registrar `origem=MANUAL` no log.

## Critérios de Aceite
- [x] Regra de disparo para `PERFORMANCE` definida como obrigatória.
- [x] Regra de disparo para `PROGRAMATICA` definida como configurável.
- [x] Regra de prioridade para campanhas híbridas definida.
- [x] Regra de não disparo em rascunho definida.
- [x] Eventos de envio e reenvio definidos para trilha de auditoria.

## Artefatos de Saída desta Task
- Documento de regra funcional aprovado.
- Mapa de eventos para implementação na task `8A-4`.

## Dependências
- Nenhuma (task de definição).

## Próximas Tasks Relacionadas
- `8A-2`: configuração de destinatários.
- `8A-3`: template de e-mail.
- `8A-4`: integração do disparo no fluxo.
