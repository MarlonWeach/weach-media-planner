# PBI-5: Fase 5 - Sincronização Supabase -> Google Sheets

## Status
📌 Pendente

## Descrição
Implementar sincronização das cotações salvas no Supabase para uma planilha Google Sheets, mantendo uma visão operacional simples para acompanhamento comercial.

## Objetivo
Disponibilizar as cotações em Google Sheets sem substituir o Supabase como fonte oficial de dados.

## Escopo Inicial
- Sincronização de cotações para uma aba de planilha.
- Definição de colunas padrão para uso comercial.
- Estratégia de sincronização a definir na implementação (agendada via cron ou por evento).
- Controle básico de falhas e reprocessamento.

## Entregáveis

### Integração
- ⏳ Credenciais e acesso à Google Sheets API configurados.
- ⏳ Serviço de sincronização implementado.
- ⏳ Mapeamento de campos Supabase -> colunas Sheets documentado.

### Operação
- ⏳ Registro de sucesso/erro por execução.
- ⏳ Mecanismo de retry para falhas transitórias.
- ⏳ Documentação de execução manual para suporte.

### Governança
- ⏳ Supabase definido como fonte de verdade.
- ⏳ Política de atualização de linhas existentes (upsert por ID da cotação).

## Critérios de Aceite
- [ ] Cotações novas aparecem na planilha.
- [ ] Cotações atualizadas refletem mudanças na mesma linha.
- [ ] Falhas de sincronização são registradas para diagnóstico.
- [ ] Processo é executável sem intervenção manual contínua.
- [ ] Documentação de configuração está disponível para o time.

## Dependências
- Acesso a conta Google com permissão na planilha de destino.
- Definição da planilha e aba oficial de operação comercial.

## Referências
- `docs/delivery/backlog.md`
- `docs/12-roadmap.md`
