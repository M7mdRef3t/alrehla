-- Phase 4: The Architect's Radar
-- Aggregated, privacy-safe awareness telemetry (no raw text payloads)

BEGIN;

CREATE OR REPLACE FUNCTION public.get_global_awareness_pulse()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_global_phoenix_avg numeric(10,4) := 0;
  v_ai_workload_avg numeric(10,2) := 0;
  v_healing_velocity numeric(10,4) := 0;
  v_kinetic_distribution jsonb := jsonb_build_object(
    'impulsive_aggressive', 0,
    'hesitant_anxious', 0,
    'scattered_unsettled', 0,
    'grounded_deliberate', 0,
    'unknown', 0
  );
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = '28000';
  END IF;

  SELECT lower(trim(p.role::text))
  INTO v_role
  FROM public.profiles p
  WHERE p.id::text = auth.uid()::text
  LIMIT 1;

  IF COALESCE(v_role, '') NOT IN ('admin', 'super_admin', 'superadmin') THEN
    RAISE EXCEPTION 'Insufficient privileges'
      USING ERRCODE = '42501';
  END IF;

  -- 1) Global Phoenix Index (active users only; no message/text columns)
  SELECT COALESCE(AVG(prc.phoenix_score), 0)::numeric(10,4)
  INTO v_global_phoenix_avg
  FROM public.pioneer_report_card prc
  JOIN public.profiles p
    ON p.id::text = prc.user_id::text
  WHERE COALESCE(p.last_active_at, now()) >= (now() - interval '30 days');

  -- 2) Kinetic distribution (today) from telemetry metadata profile only
  WITH dist AS (
    SELECT
      COALESCE(NULLIF(trim(t.metadata->>'kinetic_profile'), ''), 'unknown') AS profile_key,
      COUNT(*)::int AS cnt
    FROM public.ai_telemetry t
    WHERE t.created_at >= date_trunc('day', now())
    GROUP BY 1
  )
  SELECT
    jsonb_build_object(
      'impulsive_aggressive', 0,
      'hesitant_anxious', 0,
      'scattered_unsettled', 0,
      'grounded_deliberate', 0,
      'unknown', 0
    ) ||
    COALESCE(jsonb_object_agg(profile_key, cnt), '{}'::jsonb)
  INTO v_kinetic_distribution
  FROM dist;

  -- 3) Healing velocity (7-day trend from phoenix_score_history)
  WITH daily AS (
    SELECT
      date_trunc('day', h.recorded_at) AS day_bucket,
      AVG(h.phoenix_score)::numeric(10,4) AS day_avg
    FROM public.phoenix_score_history h
    WHERE h.recorded_at >= (now() - interval '7 days')
    GROUP BY 1
  ),
  bounds AS (
    SELECT
      (SELECT day_avg FROM daily ORDER BY day_bucket ASC LIMIT 1) AS first_avg,
      (SELECT day_avg FROM daily ORDER BY day_bucket DESC LIMIT 1) AS last_avg,
      (SELECT COUNT(*) FROM daily) AS day_count
  )
  SELECT
    COALESCE(
      CASE
        WHEN day_count <= 1 THEN (last_avg - first_avg)
        ELSE (last_avg - first_avg) / day_count
      END,
      0
    )::numeric(10,4)
  INTO v_healing_velocity
  FROM bounds;

  -- 4) System empathy load (avg LLM latency for today)
  SELECT COALESCE(AVG(t.llm_latency_ms), 0)::numeric(10,2)
  INTO v_ai_workload_avg
  FROM public.ai_telemetry t
  WHERE t.created_at >= date_trunc('day', now());

  RETURN jsonb_build_object(
    'global_phoenix_avg', v_global_phoenix_avg,
    'kinetic_distribution', v_kinetic_distribution,
    'healing_velocity', v_healing_velocity,
    'ai_workload_avg', v_ai_workload_avg,
    'generated_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_global_awareness_pulse() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_global_awareness_pulse() TO authenticated;

COMMENT ON FUNCTION public.get_global_awareness_pulse()
IS 'Admin-only aggregated awareness pulse. No raw message/chat text is returned.';

COMMIT;
