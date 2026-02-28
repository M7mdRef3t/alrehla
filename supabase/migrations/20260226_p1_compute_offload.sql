-- P1 Hotfix: Compute offloading + materialized reporting + batch recalibration
-- Date: 2026-02-26

BEGIN;

-- =====================================================
-- 1) Materialize pioneer_report_card to eliminate repeated realtime CPU-heavy extraction
-- =====================================================
DROP VIEW IF EXISTS public.pioneer_report_card;
DROP MATERIALIZED VIEW IF EXISTS public.pioneer_report_card;

CREATE MATERIALIZED VIEW public.pioneer_report_card AS
WITH event_participants AS (
    SELECT
        p.id AS user_id,
        p.email,
        COALESCE(p.sovereignty_score, 0) AS sovereignty_score,
        p.awareness_vector,
        COALESCE((p.awareness_vector->>'is_insulated')::boolean, false) AS is_insulated,
        COALESCE((p.awareness_vector->>'se')::float, 0.5) AS current_se,
        COALESCE((p.awareness_vector->>'cb')::float, 0.5) AS current_cb,
        COALESCE((p.awareness_vector->>'bi')::float, 0.5) AS current_bi,
        COALESCE((p.awareness_vector->>'av')::float, 0.5) AS current_av,
        se.id AS event_id,
        se.event_name,
        se.first_solver_id,
        CASE WHEN COALESCE((p.awareness_vector->>'is_insulated')::boolean, false) = true THEN
            GREATEST(0.1, 1.0 - LEAST(1.0,
                EXTRACT(EPOCH FROM (NOW() - se.start_time)) / 3600.0
            ))
        ELSE 0.0
        END AS reaction_speed,
        COALESCE((p.awareness_vector->>'cb')::float, 0.5) AS cb_resilience,
        COALESCE((p.awareness_vector->>'bi')::float, 0.5) AS post_event_growth
    FROM public.profiles p
    CROSS JOIN LATERAL (
        SELECT *
        FROM public.system_events
        WHERE event_type = 'high_pressure'
        ORDER BY start_time DESC
        LIMIT 1
    ) se
)
SELECT
    user_id,
    email,
    sovereignty_score,
    event_id,
    event_name,
    is_insulated,
    reaction_speed,
    cb_resilience,
    post_event_growth,
    current_se,
    current_bi,
    current_av,
    ROUND((
        0.4 * (reaction_speed / GREATEST(0.1, LN(1 + COALESCE(current_se, 0.1)))) +
        0.3 * cb_resilience +
        0.3 * post_event_growth
    )::numeric, 3) AS phoenix_score,
    (first_solver_id = user_id::uuid) AS is_aegis_prime
FROM event_participants
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS ux_pioneer_report_card_user_event
  ON public.pioneer_report_card (user_id, event_id);

COMMENT ON MATERIALIZED VIEW public.pioneer_report_card
IS 'Materialized post-impact report card. Refreshed periodically to offload realtime JSON extraction.';

-- =====================================================
-- 2) Periodic concurrent refresh via pg_cron (every 5 minutes)
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.refresh_pioneer_report_card_mv()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.pioneer_report_card;
END;
$$;

DO $$
DECLARE
  v_existing_job_id bigint;
BEGIN
  SELECT jobid
  INTO v_existing_job_id
  FROM cron.job
  WHERE jobname = 'refresh-pioneer-report-card-5min'
  LIMIT 1;

  IF v_existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'refresh-pioneer-report-card-5min',
    '*/5 * * * *',
    $job$
    SELECT public.refresh_pioneer_report_card_mv();
    $job$
  );
END;
$$;

-- =====================================================
-- 3) Batch recalibration inside DB (single call for N users)
-- =====================================================
CREATE OR REPLACE FUNCTION public.apply_phoenix_recalibration_batch(
  p_event_id uuid,
  p_entries jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer := 0;
  v_history_rows integer := 0;
  v_updated_rows integer := 0;
  v_with_dda integer := 0;
BEGIN
  WITH incoming AS (
    SELECT
      (item->>'user_id')::uuid AS user_id,
      COALESCE((item->>'phoenix_score')::float, 0.0) AS phoenix_score,
      COALESCE((item->>'swarm_impact')::float, 0.0) AS swarm_impact,
      nullif(item->>'reason', '') AS reason,
      CASE
        WHEN nullif(item->>'recommended_dda', '') IS NULL THEN NULL
        ELSE GREATEST(1, LEAST(5, (item->>'recommended_dda')::integer))
      END AS recommended_dda
    FROM jsonb_array_elements(COALESCE(p_entries, '[]'::jsonb)) AS item
    WHERE (item->>'user_id') IS NOT NULL
  ),
  prepared AS (
    SELECT
      i.user_id,
      i.phoenix_score,
      i.swarm_impact,
      i.reason,
      i.recommended_dda,
      (
        (i.phoenix_score + (0.3 * i.swarm_impact)) *
        (1.0 + LN(GREATEST(1, COALESCE(p.consistency_streak, 0) + 1)))
      )::float AS points_delta
    FROM incoming i
    JOIN public.profiles p
      ON p.id::uuid = i.user_id
  ),
  history_insert AS (
    INSERT INTO public.phoenix_score_history (
      user_id,
      event_id,
      phoenix_score,
      swarm_impact_delta,
      ascension_points_delta
    )
    SELECT
      pr.user_id,
      p_event_id,
      pr.phoenix_score,
      pr.swarm_impact,
      pr.points_delta
    FROM prepared pr
    RETURNING user_id
  ),
  profile_update AS (
    UPDATE public.profiles p
    SET
      ascension_points = COALESCE(p.ascension_points, 0.0) + pr.points_delta,
      swarm_impact_score = COALESCE(p.swarm_impact_score, 0.0) + pr.swarm_impact,
      consistency_streak = COALESCE(p.consistency_streak, 0) + 1,
      awareness_vector = CASE
        WHEN pr.recommended_dda IS NULL THEN p.awareness_vector
        ELSE jsonb_set(
          COALESCE(p.awareness_vector, '{}'::jsonb),
          '{dda}',
          to_jsonb(pr.recommended_dda),
          true
        )
      END
    FROM prepared pr
    WHERE p.id::uuid = pr.user_id
    RETURNING
      p.id::uuid AS user_id,
      p.ascension_points AS new_points,
      p.ascension_status AS old_status,
      pr.recommended_dda
  ),
  status_update AS (
    UPDATE public.profiles p
    SET ascension_status = CASE
      WHEN pu.old_status IN ('ascended', 'fallen_oracle') THEN pu.old_status
      WHEN pu.new_points >= 15.0 THEN 'invited'
      WHEN pu.new_points >= 10.0 AND pu.old_status = 'none' THEN 'candidate'
      ELSE pu.old_status
    END
    FROM profile_update pu
    WHERE p.id::uuid = pu.user_id
    RETURNING pu.user_id
  )
  SELECT
    (SELECT COUNT(*)::int FROM prepared),
    (SELECT COUNT(*)::int FROM history_insert),
    (SELECT COUNT(*)::int FROM profile_update),
    (SELECT COUNT(*)::int FROM profile_update WHERE recommended_dda IS NOT NULL)
  INTO v_total, v_history_rows, v_updated_rows, v_with_dda;

  INSERT INTO public.system_telemetry_logs (service_name, action, payload, status)
  VALUES (
    'phoenix-engine',
    'batch_recalibration_applied',
    jsonb_build_object(
      'event_id', p_event_id,
      'entries', v_total,
      'history_rows', v_history_rows,
      'updated_profiles', v_updated_rows,
      'profiles_with_dda', v_with_dda
    ),
    'success'
  );

  RETURN jsonb_build_object(
    'entries', v_total,
    'history_rows', v_history_rows,
    'updated_profiles', v_updated_rows,
    'profiles_with_dda', v_with_dda
  );
END;
$$;

COMMENT ON FUNCTION public.apply_phoenix_recalibration_batch(uuid, jsonb)
IS 'Batch Phoenix recalibration: computes formula + writes phoenix_score_history + updates profiles in one DB call.';

COMMIT;

