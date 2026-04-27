# PBI-2: Fase 2 - Admin e Regras de Preço

## Status
📌 Pendente

## Descrição
Criar módulo administrativo completo para gerenciar regras de preço, tabelas base, pisos, tetos e margens mínimas, garantindo governança rigorosa.

## Objetivo
Permitir que administradores controlem todas as regras de precificação do sistema, com auditoria completa de alterações.

## Entregáveis

### Autenticação e Autorização
- ⏳ Sistema de login com roles
- ⏳ Middleware de autorização
- ⏳ Proteção de rotas por role

### Painel Admin
- ⏳ Edição de CPM base programático (D3)
- ⏳ Tabela de valores fixos (Spotify, Deezer, etc)
- ⏳ Tabelas condicionais (FB, CTV, etc)
- ⏳ Configuração de margens mínimas por canal
- ⏳ Configuração de pisos e tetos
- ⏳ Multiplicadores regionais

### Auditoria
- ⏳ Log de todas as alterações de preço base
- ⏳ Histórico de mudanças de regras
- ⏳ Visualização de logs de alterações

## Critérios de Aceite
- [ ] Apenas admin pode acessar painel
- [ ] Todas as alterações são registradas em log
- [ ] Sistema valida regras antes de salvar
- [ ] Histórico de alterações é recuperável
- [ ] Interface intuitiva para configuração

## Dependências
- PBI-1 (MVP Funcional)

## Referências
- `docs/05-regras-de-negocio-pricing.md`
- `docs/rules/rules-pricing-governance.md`
- `docs/06-tabelas-de-preco-base.md`

