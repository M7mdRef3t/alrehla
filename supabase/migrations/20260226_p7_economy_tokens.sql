-- Phase 7: Economy Engine & Token Caps (P0)

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS awareness_tokens integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS journey_expires_at timestamptz;

CREATE OR REPLACE FUNCTION public.consume_awareness_token(p_user_id uuid, p_amount integer DEFAULT 1)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining integer := 0;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid token amount'
      USING ERRCODE = '22023';
  END IF;

  IF auth.uid() IS NULL AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = '28000';
  END IF;

  IF auth.role() <> 'service_role' AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Forbidden'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
  SET awareness_tokens = awareness_tokens - p_amount
  WHERE id::text = p_user_id::text
    AND awareness_tokens >= p_amount
    AND (journey_expires_at IS NULL OR journey_expires_at > now());

  IF NOT FOUND THEN
    SELECT COALESCE(awareness_tokens, 0)
    INTO v_remaining
    FROM public.profiles
    WHERE id::text = p_user_id::text
    LIMIT 1;

    RETURN COALESCE(v_remaining, 0);
  END IF;

  SELECT awareness_tokens
  INTO v_remaining
  FROM public.profiles
  WHERE id::text = p_user_id::text
  LIMIT 1;

  RETURN COALESCE(v_remaining, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.consume_awareness_token(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_awareness_token(uuid, integer) TO authenticated, service_role;

COMMENT ON FUNCTION public.consume_awareness_token(uuid, integer)
IS 'Atomically consumes awareness tokens and returns remaining balance.';

COMMIT;

