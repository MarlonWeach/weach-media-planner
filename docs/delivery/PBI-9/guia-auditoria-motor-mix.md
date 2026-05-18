# Guia operacional — Auditoria do motor de mix e distribuição (PBI-9-13)

Como consultar, no **Supabase** (ou qualquer cliente SQL no Postgres), se um plano foi gerado por **IA** ou **fallback**, e qual foi o **racional** da distribuição % por formato.

---

## Onde os dados ficam guardados

| Campo | Tabela | Tipo |
|-------|--------|------|
| `mixSugerido` | `wp_Cotacao` | `JSON` |

A coluna `mixSugerido` guarda um **objeto JSON** (não um array na raiz). Estrutura típica após gerar o plano no wizard:

```json
{
  "mix": [ { "canal": "DISPLAY_PROGRAMATICO", "percentual": 45, ... } ],
  "origemMix": "ia",
  "racional": "Texto do mix por canal (quando a IA devolve)...",
  "distribuicaoFormatos": {
    "origem": "ia",
    "racional": "Texto curto justificando a alocação por formato...",
    "formatos": [
      { "canal": "...", "formato": "...", "modeloCompra": "CPM", "percentual": 30 }
    ]
  }
}
```

| Campo | Significado |
|-------|-------------|
| `origemMix` | Mix **por canal**: `ia` ou `fallback_padrao` |
| `distribuicaoFormatos.origem` | % **por formato**: `ia` ou `fallback_pesos` |
| `distribuicaoFormatos.racional` | Texto explicativo (costuma existir quando `origem` = `ia`) |
| `distribuicaoFormatos.formatos` | Lista com `percentual` por linha de formato |

Cotações antigas podem ter só `mix` como array na raiz, sem `origemMix` nem `distribuicaoFormatos` — nesse caso a auditoria na UI pode vir vazia.

---

## Consulta rápida por ID da cotação

No **SQL Editor** do Supabase (substitua `2026-7` pelo ID operacional):

```sql
SELECT
  id,
  "clienteNome",
  objetivo,
  budget,
  "mixSugerido"->>'origemMix' AS origem_mix_canais,
  "mixSugerido"->'distribuicaoFormatos'->>'origem' AS origem_distribuicao_formatos,
  "mixSugerido"->'distribuicaoFormatos'->>'racional' AS racional_distribuicao_formatos
FROM "wp_Cotacao"
WHERE id = '2026-7';
```

---

## Ver a distribuição % por formato (linha a linha)

```sql
SELECT
  c.id,
  f->>'canal' AS canal,
  f->>'formato' AS formato,
  f->>'modeloCompra' AS modelo,
  (f->>'percentual')::numeric AS percentual_budget
FROM "wp_Cotacao" c,
  jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(c."mixSugerido"->'distribuicaoFormatos'->'formatos') = 'array'
      THEN c."mixSugerido"->'distribuicaoFormatos'->'formatos'
      ELSE '[]'::jsonb
    END
  ) AS f
WHERE c.id = '2026-7'
ORDER BY percentual_budget DESC;
```

---

## Listar últimas cotações com origem IA vs fallback

```sql
SELECT
  id,
  "clienteNome",
  objetivo,
  status,
  "createdAt",
  "mixSugerido"->>'origemMix' AS mix_canais,
  "mixSugerido"->'distribuicaoFormatos'->>'origem' AS pct_formatos
FROM "wp_Cotacao"
WHERE id NOT LIKE '__CONFIG%'
ORDER BY "createdAt" DESC
LIMIT 50;
```

Filtrar só planos em que a **distribuição por formato** veio do fallback:

```sql
AND "mixSugerido"->'distribuicaoFormatos'->>'origem' = 'fallback_pesos'
```

---

## Onde ver na aplicação (sem SQL)

1. Abrir a cotação no wizard (step 4) ou reabrir rascunho em `/cotacao/[id]/editar`.
2. Expandir **“Como o plano foi gerado (auditoria)”**.
3. Campos exibidos:
   - **Mix por canal:** OpenAI ou fallback padrão
   - **% investimento por formato:** OpenAI ou fallback por pesos
   - **Racional (% por formato):** texto quando a IA respondeu

A API também expõe o resumo em `GET /api/cotacao/[id]` → `cotacao.auditoriaMotor` (mesma lógica de `lib/cotacao/auditoriaMotorMix.ts`).

---

## Significado das origens

| Valor | Camada | Quando ocorre |
|-------|--------|----------------|
| `ia` | Mix por canal | Resposta válida de `gerarMixMidia` (OpenAI) |
| `fallback_padrao` | Mix por canal | Erro/timeout da IA; usa mix de referência por objetivo |
| `ia` | % por formato | Resposta válida de `gerarDistribuicaoBudgetPorFormato` |
| `fallback_pesos` | % por formato | IA inválida, >20 formatos, ou exceção; usa `pesosFormatoObjetivo` + limites (CTV, CPC, Lead Ad) |

---

## Troubleshooting

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| Auditoria vazia na UI | `mixSugerido` legado (só array) ou cotação criada antes da 9-13 | Regenerar plano ou consultar JSON bruto no SQL |
| `origem` = `fallback_pesos` mas racional parece “de IA” | Campo `racional` antigo persistido; origem foi corrigida no fallback | Confiar em `origem`; racional pode estar desatualizado |
| Percentuais no SQL ≠ tela | Itens editados manualmente no step 4 após geração | Comparar `wp_Cotacao` itens salvos / estado do wizard |
| Preço unitário errado (ex. CTV Samsung) | Regras em `wp_ValorFixoPreco` ou motor em `formulasProgramaticas` | Ver admin **Regras de preço** e guia de pricing |

---

## Referência no código

| Ficheiro | Função |
|----------|--------|
| `lib/cotacao/auditoriaMotorMix.ts` | Extrai `auditoriaMotor` do JSON |
| `lib/ia/mediaPlanner.ts` | Gera mix e distribuição; define `origemMix` / `origem` |
| `lib/ia/pesosFormatoObjetivo.ts` | Pesos e limites do fallback por formato |
| `components/cotacao/WizardStep4.tsx` | Bloco de auditoria na UI |

---

## Histórico IA (opcional / follow-up)

Prompt e resposta completos da distribuição por formato **ainda não** são gravados em `wp_HistoricoIA` por defeito. Hoje existe histórico para tipo `EXPLICACAO` (texto comercial). Para replay da distribuição, use `mixSugerido` ou aguarde task futura de persistência em `wp_HistoricoIA`.
