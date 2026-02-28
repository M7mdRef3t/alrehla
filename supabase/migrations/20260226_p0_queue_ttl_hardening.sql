-- P0 Hotfix: Database Supremacy for Queue Consistency + Atomic TTL Cleanup
-- Date: 2026-02-26

BEGIN;

-- =====================================================
-- 1) Queue schema drift normalization (awareness_events_queue)
-- =====================================================
-- Handle enum drift first (legacy queue_status with uppercase labels).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'awareness_events_queue'
      AND column_name = 'status'
      AND udt_name = 'queue_status'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typname = 'queue_status' AND e.enumlabel = 'PENDING'
    ) THEN
      ALTER TYPE public.queue_status RENAME VALUE 'PENDING' TO 'pending';
    END IF;
    IF EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typname = 'queue_status' AND e.enumlabel = 'PROCESSING'
    ) THEN
      ALTER TYPE public.queue_status RENAME VALUE 'PROCESSING' TO 'processing';
    END IF;
    IF EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typname = 'queue_status' AND e.enumlabel = 'COMPLETED'
    ) THEN
      ALTER TYPE public.queue_status RENAME VALUE 'COMPLETED' TO 'completed';
    END IF;
    IF EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typname = 'queue_status' AND e.enumlabel = 'FAILED'
    ) THEN
      ALTER TYPE public.queue_status RENAME VALUE 'FAILED' TO 'failed';
    END IF;
    IF EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typname = 'queue_status' AND e.enumlabel = 'DLQ'
    ) THEN
      ALTER TYPE public.queue_status RENAME VALUE 'DLQ' TO 'dlq';
    END IF;

    -- Converge to text to remove enum/text drift permanently.
    DROP INDEX IF EXISTS public.idx_awareness_events_due;
    DROP INDEX IF EXISTS public.idx_awareness_events_processing;
    DROP INDEX IF EXISTS public.idx_awareness_queue_pending;
    ALTER TABLE public.awareness_events_queue
      DROP CONSTRAINT IF EXISTS awareness_events_queue_status_check;
    ALTER TABLE public.awareness_events_queue
      ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE public.awareness_events_queue
      ALTER COLUMN status TYPE text
      USING lower(status::text);
  END IF;
END $$;

ALTER TABLE public.awareness_events_queue
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

UPDATE public.awareness_events_queue
SET
  status = lower(coalesce(status, 'pending')),
  next_retry_at = coalesce(next_retry_at, created_at, now())
WHERE status IS DISTINCT FROM lower(coalesce(status, 'pending'))
   OR next_retry_at IS NULL;

ALTER TABLE public.awareness_events_queue
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN next_retry_at SET DEFAULT now();

ALTER TABLE public.awareness_events_queue
  ALTER COLUMN next_retry_at SET NOT NULL;

ALTER TABLE public.awareness_events_queue
  DROP CONSTRAINT IF EXISTS awareness_events_queue_status_check;

ALTER TABLE public.awareness_events_queue
  ADD CONSTRAINT awareness_events_queue_status_check
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dlq'));

CREATE INDEX IF NOT EXISTS idx_awareness_events_due
  ON public.awareness_events_queue (status, next_retry_at, created_at)
  WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_awareness_events_processing
  ON public.awareness_events_queue (status, processed_at)
  WHERE status = 'processing';

-- =====================================================
-- 2) Concurrent claiming function (FOR UPDATE SKIP LOCKED)
-- =====================================================
CREATE OR REPLACE FUNCTION public.claim_awareness_events_batch(p_limit integer DEFAULT 100)
RETURNS SETOF public.awareness_events_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer := greatest(1, least(coalesce(p_limit, 100), 500));
BEGIN
  RETURN QUERY
  WITH picked AS (
    SELECT q.id
    FROM public.awareness_events_queue q
    WHERE q.status IN ('pending', 'failed')
      AND q.next_retry_at <= now()
    ORDER BY q.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT v_limit
  ),
  claimed AS (
    UPDATE public.awareness_events_queue q
    SET
      status = 'processing',
      processed_at = now()
    FROM picked
    WHERE q.id = picked.id
    RETURNING q.*
  )
  SELECT * FROM claimed;
END;
$$;

COMMENT ON FUNCTION public.claim_awareness_events_batch(integer)
IS 'Atomically claim due queue rows using FOR UPDATE SKIP LOCKED for concurrent workers.';

-- =====================================================
-- 3) Batch apply processing results (single SQL call)
-- =====================================================
CREATE OR REPLACE FUNCTION public.apply_awareness_event_results(p_results jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_applied integer := 0;
  v_completed integer := 0;
  v_failed integer := 0;
  v_dlq integer := 0;
BEGIN
  WITH incoming AS (
    SELECT
      (item->>'id')::uuid AS id,
      lower(coalesce(item->>'status', '')) AS status,
      nullif(item->>'error', '') AS last_error,
      coalesce((item->>'retry_count')::integer, 0) AS retry_count,
      CASE
        WHEN nullif(item->>'next_retry_at', '') IS NULL THEN NULL
        ELSE (item->>'next_retry_at')::timestamptz
      END AS next_retry_at
    FROM jsonb_array_elements(coalesce(p_results, '[]'::jsonb)) AS item
    WHERE (item->>'id') IS NOT NULL
  ),
  applied AS (
    UPDATE public.awareness_events_queue q
    SET
      status = CASE
        WHEN i.status IN ('completed', 'failed', 'dlq') THEN i.status
        ELSE q.status
      END,
      last_error = coalesce(i.last_error, q.last_error),
      retry_count = CASE
        WHEN i.status IN ('failed', 'dlq') THEN i.retry_count
        ELSE q.retry_count
      END,
      next_retry_at = CASE
        WHEN i.status = 'failed' THEN coalesce(i.next_retry_at, q.next_retry_at)
        WHEN i.status IN ('completed', 'dlq') THEN now()
        ELSE q.next_retry_at
      END,
      processed_at = now()
    FROM incoming i
    WHERE q.id = i.id
      AND q.status = 'processing'
    RETURNING i.status
  )
  SELECT
    count(*)::int,
    count(*) FILTER (WHERE status = 'completed')::int,
    count(*) FILTER (WHERE status = 'failed')::int,
    count(*) FILTER (WHERE status = 'dlq')::int
  INTO v_applied, v_completed, v_failed, v_dlq
  FROM applied;

  RETURN jsonb_build_object(
    'applied', v_applied,
    'completed', v_completed,
    'failed', v_failed,
    'dlq', v_dlq
  );
END;
$$;

COMMENT ON FUNCTION public.apply_awareness_event_results(jsonb)
IS 'Batch updates processing outcomes for awareness queue rows in a single DB call.';

COMMIT;

-- =====================================================
-- 4) Atomic DB-native TTL cleanup for resonance pairs
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE INDEX IF NOT EXISTS idx_resonance_pairs_expiry_active
  ON public.resonance_pairs (expires_at)
  WHERE status = 'active';

CREATE OR REPLACE FUNCTION public.expire_resonance_pairs_atomic()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  UPDATE public.resonance_pairs
  SET
    status = 'expired',
    completed_at = coalesce(completed_at, now())
  WHERE status = 'active'
    AND expires_at <= now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.expire_resonance_pairs_atomic()
IS 'DB-native atomic TTL cleanup for Ephemeral Entanglement pairs.';

DO $$
DECLARE
  v_existing_job_id bigint;
BEGIN
  SELECT jobid
  INTO v_existing_job_id
  FROM cron.job
  WHERE jobname = 'expire-resonance-pairs-every-minute'
  LIMIT 1;

  IF v_existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'expire-resonance-pairs-every-minute',
    '* * * * *',
    $job$
    SELECT public.expire_resonance_pairs_atomic();
    $job$
  );
END;
$$;
