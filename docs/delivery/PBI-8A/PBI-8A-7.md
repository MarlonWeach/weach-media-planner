# Task 8A-7: Implementar exclusão de cotação restrita a ADMIN

## Status
✅ Done

## Objetivo
Permitir a exclusão de cotações no dashboard apenas para usuários com perfil `ADMIN`, garantindo proteção contra acesso indevido e remoção de dados órfãos relacionados.

## Escopo
- Expor endpoint de exclusão de cotação com validação de perfil `ADMIN`.
- Adicionar ação de exclusão no card de cotação, visível somente para admin.
- Exigir confirmação explícita antes de excluir.
- Atualizar lista de cotações após exclusão com sucesso.

## Critérios de Aceite
- [x] Apenas `ADMIN` consegue excluir cotação.
- [x] Usuários não-admin não visualizam a ação de excluir.
- [x] Exclusão remove cotação e registros dependentes de auditoria/IA.
- [x] Lista do dashboard atualiza após exclusão sem recarregar a página.
