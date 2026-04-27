# Task 1-8: Criar dashboard inicial com listagem de cotações

## Status
✅ Done

## Descrição
Criar página de dashboard que lista todas as cotações do usuário com filtros, busca e ações básicas.

## Critérios de Aceite
- [x] Lista cotações do usuário logado
- [x] Exibe: nome do cliente, segmento, budget, status, data de criação
- [x] Filtros por: segmento, status, período
- [x] Busca por nome do cliente
- [x] Paginação ou scroll infinito
- [x] Link para visualizar cotação
- [x] Link para editar cotação (se rascunho)
- [x] Link para gerar PDF novamente (estrutura pronta, implementação completa na Task 1-9)
- [x] Design responsivo

## Arquivos a Criar/Modificar
- `app/dashboard/page.tsx` (criar)
- `components/dashboard/CotacaoList.tsx` (criar)
- `components/dashboard/CotacaoCard.tsx` (criar)
- `app/api/cotacao/list/route.ts` (criar)

## Dependências
- Task 1-1 (Endpoint GET cotação)

## Estimativa
6 horas

## Referências
- `docs/08-fluxos-de-usuario.md` - Seção 1, passo 2
- `docs/09-ui-ux-wireframes.md` - Seção 3.2

## Notas Técnicas
- Buscar cotações do usuário logado
- Implementar filtros no backend ou frontend
- Status deve ter cores diferentes (badges)

