-- Phase 6: Public Pulse
-- Lightweight public aggregate endpoint source (no text fields)

BEGIN;

CREATE OR REPLACE FUNCTION public.get_public_awareness_pulse()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_global_phoenix_avg numeric(10,2) := 0;
BEGIN
  SELECT COALESCE(AVG(prc.phoenix_score), 0)::numeric(10,2)
  INTO v_global_phoenix_avg
  FROM public.pioneer_report_card prc
  JOIN public.profiles p
    ON p.id::text = prc.user_id::text
  WHERE COALESCE(p.last_active_at, now()) >= (now() - interval '30 days');

  RETURN jsonb_build_object(
    'global_phoenix_avg', v_global_phoenix_avg,
    'generated_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_awareness_pulse() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_awareness_pulse() TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.get_public_awareness_pulse()
IS 'Public-safe aggregate pulse (global average only), no user text or raw chats.';

COMMIT;

