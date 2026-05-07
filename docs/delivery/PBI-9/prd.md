# PRD - PBI-9: Convivência Google Form + ID Sequencial + Sync de Respostas

## Contexto
Hoje o processo operacional ainda usa Google Form (com ID sequencial por resposta, e-mail e Google Sheets). O novo sistema já está em evolução e vai substituir o formulário no go-live.

Durante a fase de transição, os dois fluxos precisam coexistir sem perder rastreabilidade.

## Problema
- O ID da cotação no sistema não segue, hoje, a mesma sequência operacional do Google Form.
- As respostas preenchidas no sistema ainda não são gravadas no Google Sheets legado.
- Upload por arquivo no mesmo padrão do Google Form adiciona complexidade e aumenta risco de atraso no go-live.

## Objetivo
Garantir convivência controlada até o go-live:

1. O sistema passa a gerar ID no mesmo padrão sequencial usado no processo atual.
2. Cada cotação criada no sistema também é registrada no Google Sheets legado.
3. Em vez de upload de arquivo no sistema neste momento, usar campo de link de Drive informado pelo usuário.
4. No go-live, descontinuar Google Form mantendo continuidade do número sequencial.

## Escopo
- Sequenciador único no banco para geração de ID operacional.
- Migração inicial do contador com base no último número já usado no Google Form/Sheets.
- Integração de escrita no Google Sheets para novas cotações do sistema.
- Mapeamento de perguntas/respostas do formulário para colunas da planilha.
- Campo de link de Drive no lugar de upload de arquivo.
- Registro de falhas e reprocessamento de sincronização.

## Fora de Escopo
- Manter upload de arquivo binário no sistema nesta fase.
- Leitura/parsing automático de respostas antigas do Google Form para dentro do sistema.
- Substituir Google Sheets antes do go-live.

## Regras de Negócio
- A sequência do ID deve ser única e sem duplicidade, inclusive com múltiplos usuários criando cotações ao mesmo tempo.
- Durante a convivência, Google Form continua ativo e o sistema deve gravar no Google Sheets para visão unificada.
- No go-live, Google Form é desligado, mas a sequência continua sem reiniciar.
- O campo de evidência/anexo passa a aceitar URL de Drive válida.

## Estratégia Simplificada (recomendada)
Para evitar conflito entre dois sistemas:

1. Definir o banco do projeto como "dono da sequência" do ID.
2. Inicializar essa sequência com o último número atual do processo legado.
3. Toda nova cotação no sistema pega o próximo número desse contador.

Assim, a sequência não quebra no go-live e não depende de ler a planilha a cada criação.

## Métricas de Sucesso
- 100% das novas cotações do sistema com ID sequencial no padrão legado.
- 100% das cotações criadas no sistema gravadas no Google Sheets (ou com erro registrado para retry).
- 0 duplicidade de ID em produção.
- Transição para go-live sem reset de numeração.
