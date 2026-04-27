# Task 1-6: Criar componente de tabela de preços dinâmica

## Status
✅ Done

## Descrição
Criar componente reutilizável de tabela que exibe o plano de mídia com canais, formatos, modelos de compra, preços, percentuais de budget e estimativas.

## Critérios de Aceite
- [x] Tabela responsiva e acessível
- [x] Exibe: canal, formato, modelo de compra, preço, % budget, estimativas
- [x] Formatação de valores monetários (R$)
- [x] Formatação de percentuais
- [x] Cálculo de valores totais por canal
- [x] Cálculo de totais gerais
- [x] Design conforme identidade visual Weach
- [x] Suporta edição de preços (quando habilitado)

## Arquivos a Criar/Modificar
- `components/cotacao/PricingTable.tsx` (criar)
- `components/ui/Table.tsx` (criar se necessário)

## Dependências
- Nenhuma (componente isolado)

## Estimativa
6 horas

## Referências
- `docs/09-ui-ux-wireframes.md` - Seção 3.6

## Notas Técnicas
- Usar componente de tabela do shadcn/ui ou criar customizado
- Formatação com Intl.NumberFormat
- Suportar diferentes modelos de compra (CPM, CPC, CPV, etc)
- Cálculos devem ser precisos (usar Decimal para evitar erros de ponto flutuante)

