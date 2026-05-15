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
| 9-7 | Virada: planilha nova só app, aba `Form Responses 1`, ID `ano-sequência` (ex. `2026-1`) | ✅ Done | ⚠️ Alta |
| 9-8 | Wizard de cotação: segmentos adicionais, briefing/e-mail/PDF por escopo, rascunho, UX Step 4 (banner/PDF) e validação API alinhada ao enum | ✅ Done | 📌 Média |
| 9-9 | Dashboard (`/dashboard`): trocar layout de cards para listagem (tabela ou lista densa responsiva) | ✅ Done | 📌 Média |
| 9-10 | Dashboard: exibir tag por cotação (Programática, Performance ou Mensageria) conforme definição da campanha | ✅ Done | 📌 Média |
| 9-11 | Dashboard: validar visibilidade — usuário com papel **manager** deve listar todas as cotações; corrigir API/query se houver filtro indevido | ✅ Done | ⚠️ Alta |
| 9-12 | Header global: fundo `#1f2b51`, logo Weach (negativa/branca) e ações **Home**, **Admin** (e demais links já existentes) em todas as páginas | ✅ Done | 📌 Média |
| 9-13 | Flag e auditoria: distribuição de budget por formato — origem IA vs fallback + racional exposto | 📌 Proposed | 📌 Média |

## Ordem Recomendada
1. `9-1` padrão de ID e exemplos
2. `9-2` contador transacional + seed
3. `9-3` adoção no fluxo de criação
4. `9-4` escrita no Sheets
5. `9-5` observabilidade e retry
6. `9-6` link de Drive em vez de upload
7. `9-7` plano de cutover/go-live
8. `9-8` segmentos e UX do wizard (paralelo ao cutover quando aplicável)
9. `9-9` a `9-11` melhorias de dashboard (podem seguir em paralelo após alinhar critério visual com design)
10. `9-12` header global (preferencialmente via layout raiz `app/layout.tsx` ou componente compartilhado), antes ou em paralelo ao refinamento do dashboard
11. `9-13` rastreabilidade IA vs fallback na distribuição % por formato (ver `PBI-9-13.md`)

## Observações
- **Duas planilhas:** legado (Google Form) e nova (`GOOGLE_SHEETS_ID` do app); mesma aba `Form Responses 1`. Form segue ativo até go-live (9-7).
- **ID operacional:** `{ano}-{seq}` (ex. `2026-1`); contador por ano no banco — ver `PBI-9-7.md`.
- O banco do projeto será a fonte da sequência do ID para evitar duplicidade.
- A integração com Sheets deve gravar as respostas do sistema no layout operacional legado.
- **Progresso recente (9-8):** enum `Segmento` no Prisma + lista única `lib/cotacao/segmentosCotacao.ts` (wizard + `POST /api/cotacao/criar`); após alterar o schema, rodar `npx prisma generate` e `npx prisma db push` (ou migration) no ambiente.
- **Dashboard (9-9 a 9-11):** reutilizar a mesma fonte de verdade da definição de campanha que o wizard/e-mail (`resolverApenasPerformance` / observações) para tags e, no 9-11, alinhar regra de listagem com `podeAcessarCotacao` ou política explícita para `Role.MANAGER` (ou equivalente no projeto).
- **Header (9-12):** cor de fundo `#1f2b51`; logo em versão clara (ex. `public/branding/weach-negative.png` ou asset equivalente com fundo transparente); botões/links condicionados a papel (ex. Admin só para quem tiver permissão).
