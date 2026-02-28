-- Phase 9: Hybrid Checkout Engine - Admin Manual Premium Activation

BEGIN;

CREATE OR REPLACE FUNCTION public.grant_premium_access(user_id_input uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_role text;
BEGIN
  IF user_id_input IS NULL THEN
    RAISE EXCEPTION 'user_id_input is required'
      USING ERRCODE = '22023';
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = '28000';
  END IF;

  SELECT role
  INTO v_actor_role
  FROM public.profiles
  WHERE id::text = auth.uid()::text
  LIMIT 1;

  IF v_actor_role IS NULL OR lower(v_actor_role) NOT IN ('admin', 'owner', 'superadmin', 'super_admin') THEN
    RAISE EXCEPTION 'Forbidden'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET awareness_tokens = 100,
      journey_expires_at = now() + interval '21 days'
  WHERE id::text = user_id_input::text;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_premium_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_premium_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_premium_access(uuid) TO service_role;

COMMENT ON FUNCTION public.grant_premium_access(uuid)
IS 'Admin-only manual premium activation: sets 100 awareness tokens and 21-day expiry.';

COMMIT;
