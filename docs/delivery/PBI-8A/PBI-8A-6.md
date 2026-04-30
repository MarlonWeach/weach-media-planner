# Task 8A-6: Expor histórico de envios no painel administrativo

## Status
✅ Done

## Objetivo
Disponibilizar no painel administrativo uma visualização centralizada do histórico de envios de cotações, com filtros operacionais e paginação, permitindo acompanhamento por status, período e identificação da cotação.

## Escopo Implementado
- Criação de endpoint admin para consulta paginada do histórico de envios.
- Inclusão de filtros por status, busca (ID/cliente) e período.
- Exibição de dados operacionais relevantes: cliente, objetivo, definição de campanha, status, solicitante, vendedor e link do PDF.
- Nova tela no painel administrativo para consumo desse histórico.
- Inclusão de atalho no menu administrativo.

## Critérios de Aceite
- [x] Histórico de envios visível no painel administrativo.
- [x] Acesso restrito a perfil ADMIN.
- [x] Filtros por status, período e busca textual.
- [x] Paginação funcional.
- [x] Exibição de metadados operacionais por cotação enviada.

## Arquivos Alterados
- `app/api/admin/envios/route.ts`
- `app/admin/envios/page.tsx`
- `app/admin/page.tsx`

## Notas Técnicas
- O histórico considera, por padrão, os status operacionais de envio (`ENVIADA`, `APROVADA`, `RECUSADA`, `EM_EXECUCAO`, `FINALIZADA`, `AGUARDANDO_APROVACAO`).
- A definição de campanha é extraída de `observacoes` (payload JSON), com fallback para `N/A`.
