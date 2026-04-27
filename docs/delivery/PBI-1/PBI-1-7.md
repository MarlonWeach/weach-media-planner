# Task 1-7: Implementar validações visuais de governança

## Status
✅ Done

## Descrição
Criar componentes e lógica para exibir alertas visuais quando preços violam regras de governança (margem mínima, piso, teto).

## Critérios de Aceite
- [x] Componente AlertBox para exibir avisos
- [x] Validação em tempo real ao editar preços
- [x] Exibe erro quando preço < piso
- [x] Exibe erro quando preço > teto
- [x] Exibe aviso quando margem < mínima
- [x] Exibe aviso quando preço muito abaixo/alto do alvo
- [x] Bloqueia salvamento se houver erros (implementado no Passo 4)
- [x] Permite salvamento com avisos (requer aprovação)
- [x] Design de alertas conforme identidade visual

## Arquivos a Criar/Modificar
- `components/cotacao/AlertBox.tsx` (criar)
- `components/cotacao/GovernanceValidator.tsx` (criar)
- `lib/pricing/regrasGovernanca.ts` (já existe, pode precisar ajustes)

## Dependências
- Task 1-6 (Tabela de preços)

## Estimativa
4 horas

## Referências
- `docs/05-regras-de-negocio-pricing.md` - Seções 5 e 6
- `docs/rules/rules-pricing-governance.md`

## Notas Técnicas
- Integrar com função validarPreco existente
- Validação deve ser síncrona e rápida
- Alertas devem ser claros e acionáveis

