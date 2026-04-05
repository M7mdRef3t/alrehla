-- Harden remote drift for gate_sessions RLS and mutable function search_path.
-- This migration is intentionally idempotent because the remote project already
-- has permissive policies that are not represented in the local repo.

ALTER TABLE IF EXISTS public.gate_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous inserts to gate_sessions" ON public.gate_sessions;
DROP POLICY IF EXISTS "Allow anonymous updates to own session" ON public.gate_sessions;
DROP POLICY IF EXISTS "Public can strictly read own gate_session" ON public.gate_sessions;

-- The current flow writes and reads gate sessions only from Next.js API routes
-- using the service role key, so direct client access should stay closed.
CREATE POLICY "Service role can manage gate sessions"
ON public.gate_sessions
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS identity_args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'add_user_points'
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = public',
      fn.schema_name,
      fn.function_name,
      fn.identity_args
    );
  END LOOP;
END
$$;
