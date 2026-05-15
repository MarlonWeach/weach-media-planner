-- =============================================================================
-- Supabase Advisor INFO: "RLS enabled, but no policies exist" (tabelas wp_*)
--
-- Onde executar: Supabase Dashboard → SQL Editor → Run
--
-- Contexto: com RLS ligado e ZERO políticas, o PostgREST (anon/authenticated)
-- já não vê linhas — mas o Advisor pede políticas explícitas OU desligar RLS.
--
-- RECOMENDADO: **Opção B** — mantém RLS e adiciona uma política que nega
-- explicitamente anon + authenticated em todas as operações. O acesso da
-- app via Prisma costuma usar outro papel (ex.: postgres / pooler) e não fica
-- bloqueado por estas políticas — CONFIRMA no vosso `DATABASE_URL` se algum
-- cliente usa o papel `authenticated` ou `anon` antes de aplicar em prod.
--
-- Opção A: desliga RLS (só se a equipa decidir que RLS nestas tabelas foi
-- activado por engano e não há uso de API Supabase).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Opção B (recomendada): política explícita — nega anon + authenticated
-- Idempotente: remove política com o mesmo nome antes de criar.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "pbi10_block_anon_authenticated" ON public."wp_Agencia";
CREATE POLICY "pbi10_block_anon_authenticated" ON public."wp_Agencia"
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "pbi10_block_anon_authenticated" ON public."wp_Configuracao";
CREATE POLICY "pbi10_block_anon_authenticated" ON public."wp_Configuracao"
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "pbi10_block_anon_authenticated" ON public."wp_Cotacao";
CREATE POLICY "pbi10_block_anon_authenticated" ON public."wp_Cotacao"
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "pbi10_block_anon_authenticated" ON public."wp_HistoricoIA";
CREATE POLICY "pbi10_block_anon_authenticated" ON public."wp_HistoricoIA"
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "pbi10_block_anon_authenticated" ON public."wp_IntegracaoSheetsLog";
CREATE POLICY "pbi10_block_anon_authenticated" ON public."wp_IntegracaoSheetsLog"
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "pbi10_block_anon_authenticated" ON public."wp_LogAlteracaoPreco";
CREATE POLICY "pbi10_block_anon_authenticated" ON public."wp_LogAlteracaoPreco"
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "pbi10_block_anon_authenticated" ON public."wp_MargemMinima";
CREATE POLICY "pbi10_block_anon_authenticated" ON public."wp_MargemMinima"
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "pbi10_block_anon_authenticated" ON public."wp_PrecoBase";
CREATE POLICY "pbi10_block_anon_authenticated" ON public."wp_PrecoBase"
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "pbi10_block_anon_authenticated" ON public."wp_Solicitante";
CREATE POLICY "pbi10_block_anon_authenticated" ON public."wp_Solicitante"
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "pbi10_block_anon_authenticated" ON public."wp_Usuario";
CREATE POLICY "pbi10_block_anon_authenticated" ON public."wp_Usuario"
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "pbi10_block_anon_authenticated" ON public."wp_ValorFixoPreco";
CREATE POLICY "pbi10_block_anon_authenticated" ON public."wp_ValorFixoPreco"
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);


-- ---------------------------------------------------------------------------
-- Verificação: tabelas wp_* em public com RLS e sem políticas (lista vazia)
-- ---------------------------------------------------------------------------
SELECT c.relname AS tabela
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname LIKE 'wp\_%' ESCAPE '\'
  AND c.relrowsecurity = true
  AND NOT EXISTS (
    SELECT 1
    FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = c.relname
  )
ORDER BY 1;


-- =============================================================================
-- Opção A (alternativa): desactivar RLS nas mesmas tabelas
-- NÃO executar ao mesmo tempo que a Opção B — escolhe só um caminho.
-- Descomenta o bloco abaixo apenas se a equipa confirmar que não precisam RLS.
-- =============================================================================
/*
ALTER TABLE public."wp_Agencia" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."wp_Configuracao" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."wp_Cotacao" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."wp_HistoricoIA" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."wp_IntegracaoSheetsLog" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."wp_LogAlteracaoPreco" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."wp_MargemMinima" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."wp_PrecoBase" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."wp_Solicitante" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."wp_Usuario" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."wp_ValorFixoPreco" DISABLE ROW LEVEL SECURITY;
*/
