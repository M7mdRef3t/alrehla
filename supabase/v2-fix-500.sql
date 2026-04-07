-- =============================================================================
-- Dawayir V2 — RLS Infinite Recursion Fix (500 Internal Server Error)
-- =============================================================================
-- The 500 error on `routing_events` is caused by an infinite RLS recursion loop:
-- 1. `routing_events` policy calls `is_admin_check(auth.uid())`
-- 2. `is_admin_check` queries `profiles`
-- 3. `profiles` has an admin policy that calls `is_admin_check(auth.uid())`
-- 4. Infinite loop -> 500 Error.
-- 
-- The accepted Supabase fix is to read from a secure View that bypasses RLS
-- for this explicit internal check, breaking the cycle.

-- 1. Create a secure view that bypasses RLS (runs as creator/postgres)
CREATE OR REPLACE VIEW public.profiles_admin_view AS
SELECT id, role FROM public.profiles;

-- 2. Secure the view so regular users cannot access it directly
REVOKE ALL ON public.profiles_admin_view FROM public, anon, authenticated;

-- 3. Update the admin check to query the secure view instead of the RLS-protected table
CREATE OR REPLACE FUNCTION public.is_admin_check(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  IF check_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT role INTO v_role 
  FROM public.profiles_admin_view 
  WHERE id = check_user_id::text 
  LIMIT 1;

  RETURN v_role IN ('admin', 'owner', 'superadmin', 'developer');
END;
$$;

-- 4. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
