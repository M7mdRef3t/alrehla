-- P3-B: Offline Predictive Healing
-- Date: 2026-02-26

BEGIN;

CREATE TABLE IF NOT EXISTS public.pending_interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_message text NOT NULL,
  trigger_reason text NOT NULL,
  status text NOT NULL DEFAULT 'unread'
    CHECK (status IN ('unread', 'read')),
  read_at timestamptz NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_pending_interventions_user_status_created
  ON public.pending_interventions (user_id, status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ux_pending_interventions_unread_reason
  ON public.pending_interventions (user_id, trigger_reason)
  WHERE status = 'unread';

ALTER TABLE public.pending_interventions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pending_interventions'
      AND policyname = 'pending_interventions_select_own'
  ) THEN
    CREATE POLICY pending_interventions_select_own
      ON public.pending_interventions
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pending_interventions'
      AND policyname = 'pending_interventions_insert_service_role'
  ) THEN
    CREATE POLICY pending_interventions_insert_service_role
      ON public.pending_interventions
      FOR INSERT
      TO authenticated, anon
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pending_interventions'
      AND policyname = 'pending_interventions_update_own_read'
  ) THEN
    CREATE POLICY pending_interventions_update_own_read
      ON public.pending_interventions
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.mark_pending_interventions_read(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows integer := 0;
BEGIN
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

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.trigger_offline_healing_worker()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_project_ref text;
  v_service_role_key text;
  v_url text;
BEGIN
  v_project_ref := current_setting('app.settings.project_ref', true);
  v_service_role_key := current_setting('app.settings.service_role_key', true);

  IF v_project_ref IS NULL OR v_service_role_key IS NULL THEN
    INSERT INTO public.system_telemetry_logs (service_name, action, status, payload)
    VALUES (
      'offline-healing-worker',
      'cron_trigger_skipped',
      'warning',
      jsonb_build_object(
        'reason', 'missing app.settings.project_ref/service_role_key'
      )
    );
    RETURN;
  END IF;

  v_url := format('https://%s.supabase.co/functions/v1/offline-healing-worker', v_project_ref);

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    ),
    body := jsonb_build_object(
      'source', 'pg_cron',
      'triggered_at', now()
    )
  );
END;
$$;

DO $$
DECLARE
  v_existing_job_id bigint;
BEGIN
  SELECT jobid
  INTO v_existing_job_id
  FROM cron.job
  WHERE jobname = 'offline-healing-worker-12h'
  LIMIT 1;

  IF v_existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'offline-healing-worker-12h',
    '0 */12 * * *',
    $job$
    SELECT public.trigger_offline_healing_worker();
    $job$
  );
END;
$$;

COMMENT ON TABLE public.pending_interventions
IS 'Queued AI interventions generated while user is offline; consumed on next app open.';

COMMENT ON FUNCTION public.mark_pending_interventions_read(uuid)
IS 'Marks unread offline interventions as read for a user and returns affected row count.';

COMMIT;

