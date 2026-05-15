-- =============================================================================
-- Supabase Advisor WARN: public.rls_auto_enable() (SECURITY DEFINER + anon)
-- Colar no Supabase: SQL Editor → New query → Run
--
-- O que faz: remove a possibilidade de `anon` e `authenticated` chamarem esta
-- função via PostgREST (/rest/v1/rpc/rls_auto_enable), mantendo uso típico só
-- para roles de manutenção (ex.: service_role, se precisarem).
--
-- ANTES: confirma que nenhum produto chama este RPC com chave anon/jwt user.
-- =============================================================================

-- 1) Revogar execução pública e dos roles expostos na API
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;

-- 2) Opcional: permitir só a role de serviço (Edge Functions, scripts com
--    service_role). Descomenta se precisares de chamar o RPC server-side.
-- GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;

-- =============================================================================
-- Verificação (deve ser `f` para anon e authenticated)
-- =============================================================================
SELECT has_function_privilege('anon', 'public.rls_auto_enable()', 'EXECUTE')
  AS anon_pode_executar;
SELECT has_function_privilege('authenticated', 'public.rls_auto_enable()', 'EXECUTE')
  AS authenticated_pode_executar;
