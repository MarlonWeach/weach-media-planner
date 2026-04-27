# Task 1-5: Implementar wizard de cotação - Passo 4 (Resultado e Ajustes)

## Status
✅ Done

## Descrição
Criar o quarto passo do wizard que exibe o resultado gerado pela IA, permite ajustes de preços e mix, e gera o PDF final.

## Critérios de Aceite
- [x] Exibe resumo executivo gerado pela IA
- [x] Tabela de mídia com canais, modelos, preços, percentuais e estimativas
- [x] Permite edição de preços dentro da faixa permitida
- [x] Exibe alertas de margem mínima, piso e teto
- [x] Valida alterações de preço em tempo real
- [x] Botão "Gerar PDF" funcional (estrutura pronta, implementação completa na Task 1-9)
- [x] Botão "Salvar rascunho" funcional (estrutura pronta, implementação completa na Task 1-11)
- [x] Botão "Voltar" funcional
- [x] Loading state durante geração do plano

## Arquivos a Criar/Modificar
- `components/cotacao/WizardStep4.tsx` (criar)
- `components/cotacao/PricingTable.tsx` (criar)
- `components/cotacao/EditablePriceCell.tsx` (criar)
- `components/cotacao/AlertBox.tsx` (criar)
- `app/cotacao/nova/page.tsx` (modificar)

## Dependências
- Task 1-4 (Passo 3 do wizard)
- Task 1-6 (Tabela de preços)
- Task 1-7 (Validações)

## Estimativa
8 horas

## Referências
- `docs/08-fluxos-de-usuario.md` - Seção 1, passo 8-10
- `docs/09-ui-ux-wireframes.md` - Seção 3.6

## Notas Técnicas
- Integrar com API POST /api/cotacao/criar
- Chamar IA para gerar mix e explicação
- Validar preços contra regras de governança
- Células editáveis com validação em tempo real

