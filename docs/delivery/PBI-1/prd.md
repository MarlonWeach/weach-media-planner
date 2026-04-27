# PBI-1: Fase 1 - MVP Funcional

## Status
🔄 InProgress

## Descrição
Desenvolver o MVP funcional capaz de criar uma cotação end-to-end com preços reais, incluindo wizard de cotação, geração de PDF e dashboard básico.

## Objetivo
Ter um sistema completo que permita criar cotações do início ao fim, com geração automática de planos de mídia, preços e documentos comerciais.

## Entregáveis

### Backend e Core
- ✅ Motor determinístico implementado
- ✅ Rotas de API criadas
- ⏳ Endpoint GET /api/cotacao/{id}
- ⏳ Validações completas de governança

### Frontend
- ⏳ Wizard de cotação em 4 passos
- ⏳ Dashboard inicial
- ⏳ Tabela dinâmica de preços e estimativas
- ⏳ Validações visuais de margem e governança

### IA
- ✅ Agente Media Planner implementado
- ✅ Agente Explainer implementado
- ⏳ Agente Validator

### Geração de PDF
- ⏳ Template de PDF com branding Weach
- ⏳ Resumo executivo
- ⏳ Plano de mídia completo
- ⏳ Estimativas e preços

## Critérios de Aceite
- [ ] Usuário consegue criar cotação completa via wizard
- [ ] Sistema gera mix de mídia automaticamente
- [ ] Preços são calculados corretamente
- [ ] PDF é gerado com todas as informações
- [ ] Validações de governança funcionam
- [ ] Dashboard lista cotações criadas

## Dependências
- PBI-0 (✅ Concluído)

## Referências
- `docs/08-fluxos-de-usuario.md` - Fluxo comercial
- `docs/09-ui-ux-wireframes.md` - Wireframes
- `docs/04-especificacao-campos-formulario.md` - Campos do formulário

