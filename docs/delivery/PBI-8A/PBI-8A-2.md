# Task 8A-2: Definir configuração de destinatários (principal, CC interno, solicitante)

## Status
🔄 InProgress

## Descrição
Definir como o sistema monta a lista de destinatários de e-mail da cotação, com regras por tipo de campanha e possibilidade de configuração sem deploy.

## Objetivo
Garantir que toda cotação enviada por e-mail chegue ao responsável comercial correto, com cópia para validação interna e visibilidade para o solicitante.

## Estratégia de Configuração (v1)

### 1) Variáveis de ambiente
- `EMAIL_COTACAO_TO`: destinatário(s) principal(is), separados por vírgula.
- `EMAIL_COTACAO_CC`: cópia interna padrão, separados por vírgula.
- `EMAIL_COTACAO_CC_PERFORMANCE`: cópia adicional quando houver `PERFORMANCE`.
- `EMAIL_COTACAO_CC_PROGRAMATICA`: cópia adicional quando houver `PROGRAMATICA` ou `WHATSAPP_SMS_PUSH`.
- `EMAIL_COTACAO_INCLUDE_SOLICITANTE`: `true|false` para incluir e-mail do solicitante no envio.

### 2) Regra de composição
- Sempre incluir `TO` base.
- Sempre incluir `CC` base.
- Adicionar `CC` por tipo de campanha conforme regra da task `8A-1`.
- Se `EMAIL_COTACAO_INCLUDE_SOLICITANTE=true`, incluir solicitante (quando e-mail válido).
- Remover duplicados e normalizar caixa (`trim`, `lowercase`).

### 3) Fallback seguro
- Se `TO` não estiver configurado, bloquear envio e registrar erro de configuração.
- Se o solicitante não tiver e-mail válido, continuar envio sem solicitante e registrar aviso no log.

## Critérios de Aceite
- [ ] Variáveis de ambiente de destinatários definidas e documentadas.
- [ ] Regra de composição (TO/CC por tipo) definida.
- [ ] Política de inclusão do solicitante definida.
- [ ] Regra de deduplicação definida.
- [ ] Política de fallback/erro de configuração definida.

## Artefatos de Saída desta Task
- Contrato de configuração de destinatários para implementação na `8A-4`.
- Checklist de variáveis obrigatórias para ambiente (local, staging e produção).

## Dependências
- `8A-1` concluída.

## Próximas Tasks Relacionadas
- `8A-3`: template de e-mail.
- `8A-4`: integração com disparo.
