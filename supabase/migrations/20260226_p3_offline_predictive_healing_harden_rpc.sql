-- P3-B hardening: enforce caller ownership for mark_pending_interventions_read
-- Date: 2026-02-26

BEGIN;

CREATE OR REPLACE FUNCTION public.mark_pending_interventions_read(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows integer := 0;
BEGIN
  IF auth.role() <> 'service_role' AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Forbidden: cannot mark another user interventions as read'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.pending_interventions
  SET
    status = 'read',
    read_at = now()
  WHERE user_id = p_user_id
    AND status = 'unread';

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$;

COMMIT;

