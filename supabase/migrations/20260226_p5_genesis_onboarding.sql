-- Phase 5: Genesis Flow
-- Move onboarding truth from localStorage to DB profile state

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_onboarded boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.mark_user_onboarded(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = '28000';
  END IF;

  IF auth.role() <> 'service_role' AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Forbidden: cannot mark another user as onboarded'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET is_onboarded = true
  WHERE id::text = p_user_id::text
    AND COALESCE(is_onboarded, false) = false;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows > 0 THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id::text = p_user_id::text
      AND COALESCE(p.is_onboarded, false) = true
  );
END;
$$;

REVOKE ALL ON FUNCTION public.mark_user_onboarded(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_user_onboarded(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.mark_user_onboarded(uuid)
IS 'Marks the current authenticated user onboarding as completed (idempotent).';

COMMIT;

