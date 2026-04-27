# Task 1-2: Implementar wizard de cotação - Passo 1 (Dados do Cliente)

## Status
✅ Done

## Descrição
Criar o primeiro passo do wizard de cotação com campos: nome do cliente, segmento, URL da landing page e observações iniciais.

## Critérios de Aceite
- [x] Formulário com todos os campos do passo 1
- [x] Validação de campos obrigatórios
- [x] Validação de URL (deve conter http/https)
- [x] Dropdown de segmento funcional
- [x] Botões "Voltar" e "Próximo" funcionais
- [x] Dados são salvos no estado/localStorage
- [x] Design conforme wireframes

## Arquivos a Criar/Modificar
- `app/cotacao/nova/page.tsx` (criar)
- `components/cotacao/WizardStep1.tsx` (criar)
- `components/cotacao/FormField.tsx` (criar)

## Dependências
- Nenhuma

## Estimativa
4 horas

## Referências
- `docs/04-especificacao-campos-formulario.md` - Campos do formulário
- `docs/09-ui-ux-wireframes.md` - Wireframes

## Notas Técnicas
- Usar React Hook Form ou similar para gerenciamento de formulário
- Validação com Zod
- Estado gerenciado com Context API ou Zustand

