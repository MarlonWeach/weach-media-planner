# Task 1-4: Implementar wizard de cotação - Passo 3 (Budget, Período e Região)

## Status
✅ Done

## Descrição
Criar o terceiro passo do wizard com campos: budget total, data de início, data de término, região e campo opcional para mix manual.

## Critérios de Aceite
- [x] Campo de budget com validação (mínimo R$ 1.000)
- [x] Datepickers para início e fim
- [x] Validação de data (fim > início)
- [x] Dropdown de região funcional
- [x] Campo opcional para mix manual (percentuais por canal)
- [x] Validação: soma de percentuais = 100% (se preenchido)
- [x] Botões "Voltar" e "Próximo" funcionais
- [x] Dados são salvos no estado

## Arquivos a Criar/Modificar
- `components/cotacao/WizardStep3.tsx` (criar)
- `app/cotacao/nova/page.tsx` (modificar)

## Dependências
- Task 1-3 (Passo 2 do wizard)

## Estimativa
4 horas

## Referências
- `docs/04-especificacao-campos-formulario.md` - Seções 3 e 4

## Notas Técnicas
- Usar biblioteca de datepicker (ex: react-datepicker)
- Validação de budget com formatação de moeda
- Mix manual é opcional, mas se preenchido deve somar 100%

