# Tasks - PBI-9: Convivência Google Form + ID Sequencial + Sync de Respostas

## Status Geral
🔄 InProgress

## Tasks

| ID | Descrição | Status | Prioridade |
|----|-----------|--------|------------|
| 9-1 | Definir padrão final do ID operacional e regra de formatação | ✅ Done | ⚠️ Alta |
| 9-2 | Implementar contador sequencial transacional no banco com seed inicial do legado | ✅ Done | 🚨 Crítica |
| 9-3 | Substituir geração de ID atual para usar o novo sequenciador em todas as entradas de cotação | ✅ Done | 🚨 Crítica |
| 9-4 | Implementar integração de escrita no Google Sheets com mapeamento de perguntas/respostas | ✅ Done | ⚠️ Alta |
| 9-5 | Implementar log de sincronização, retry e idempotência por cotação | ✅ Done | ⚠️ Alta |
| 9-6 | Trocar upload de arquivo por campo de URL de Drive com validação e instrução ao usuário | ✅ Done | 📌 Média |
| 9-7 | Definir e executar checklist de virada de chave (desligar Google Form e manter sequência) | 📌 Pendente | ⚠️ Alta |
| 9-8 | Wizard de cotação: segmentos adicionais, briefing/e-mail/PDF por escopo, rascunho, UX Step 4 (banner/PDF) e validação API alinhada ao enum | ✅ Done | 📌 Média |

## Ordem Recomendada
1. `9-1` padrão de ID e exemplos
2. `9-2` contador transacional + seed
3. `9-3` adoção no fluxo de criação
4. `9-4` escrita no Sheets
5. `9-5` observabilidade e retry
6. `9-6` link de Drive em vez de upload
7. `9-7` plano de cutover/go-live
8. `9-8` segmentos e UX do wizard (paralelo ao cutover quando aplicável)

## Observações
- Durante todo o PBI-9, Google Form continua em uso até a virada oficial.
- O banco do projeto será a fonte da sequência do ID para evitar duplicidade.
- A integração com Sheets deve gravar as respostas do sistema no layout operacional legado.
- **Progresso recente (9-8):** enum `Segmento` no Prisma + lista única `lib/cotacao/segmentosCotacao.ts` (wizard + `POST /api/cotacao/criar`); após alterar o schema, rodar `npx prisma generate` e `npx prisma db push` (ou migration) no ambiente.
