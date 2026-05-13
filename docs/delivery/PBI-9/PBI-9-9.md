# Task 9-9: Dashboard — layout em lista em vez de cards

## Status
✅ Done

## Descrição
Substituir o layout atual da página `/dashboard`, baseado em **cards**, por uma **listagem** (tabela com colunas principais ou lista densa), mantendo filtros/ações existentes e responsividade mobile.

## Objetivo
Melhorar escaneabilidade e densidade de informação quando há muitas cotações, alinhando a UX a um padrão operacional tipo “inbox”.

## Critérios de Aceite
- [ ] `/dashboard` exibe cotações em formato de lista/tabela (não grid de cards como padrão principal).
- [ ] Colunas ou linhas cobrem ao menos: identificador da cotação, cliente/campanha, status, data, link para detalhe.
- [ ] Layout responsivo: em viewports estreitas, colunas secundárias podem colapsar ou empilhar sem perda de acesso ao detalhe.
- [ ] Nenhuma regressão em autenticação ou carregamento de dados (mesma API ou evolução documentada).

## Notas
- Alinhar estilo a componentes já usados no admin (tabelas) quando fizer sentido.
