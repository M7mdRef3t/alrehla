-- P2-B: Agentic Telemetry (append-only)
-- Date: 2026-02-26

BEGIN;

CREATE TABLE IF NOT EXISTS public.ai_telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  request_id text NOT NULL,
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  feature text NOT NULL DEFAULT 'unknown',
  agent_name text NOT NULL DEFAULT 'unknown',
  provider text NOT NULL DEFAULT 'gemini',
  model text NOT NULL DEFAULT 'unknown',
  event_id uuid NULL REFERENCES public.system_events(id) ON DELETE SET NULL,
  queue_event_id uuid NULL REFERENCES public.awareness_events_queue(id) ON DELETE SET NULL,
  llm_latency_ms integer NOT NULL DEFAULT 0 CHECK (llm_latency_ms >= 0),
  prompt_tokens integer NOT NULL DEFAULT 0 CHECK (prompt_tokens >= 0),
  completion_tokens integer NOT NULL DEFAULT 0 CHECK (completion_tokens >= 0),
  total_tokens integer NOT NULL DEFAULT 0 CHECK (total_tokens >= 0),
  estimated_cost_usd numeric(12, 6) NOT NULL DEFAULT 0 CHECK (estimated_cost_usd >= 0),
  json_success boolean NOT NULL DEFAULT false,
  failure_reason text NULL,
  error_message text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.ai_telemetry
  ADD CONSTRAINT ai_telemetry_failure_reason_check
  CHECK (
    failure_reason IS NULL OR
    failure_reason IN (
      'hallucination',
      'format_mismatch',
      'token_limit_exceeded',
      'rate_limited',
      'timeout',
      'provider_error',
      'network_error',
      'unknown'
    )
  );

ALTER TABLE public.ai_telemetry
  ADD CONSTRAINT ai_telemetry_json_failure_consistency_check
  CHECK (
    (json_success = true AND failure_reason IS NULL) OR
    (json_success = false AND failure_reason IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_ai_telemetry_created_at
  ON public.ai_telemetry (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_telemetry_feature_created
  ON public.ai_telemetry (feature, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_telemetry_user_created
  ON public.ai_telemetry (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_telemetry_json_failure
  ON public.ai_telemetry (json_success, failure_reason, created_at DESC);

ALTER TABLE public.ai_telemetry ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_telemetry' AND policyname = 'ai_telemetry_insert_service_role'
  ) THEN
    CREATE POLICY ai_telemetry_insert_service_role
      ON public.ai_telemetry
      FOR INSERT
      TO authenticated, anon
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.prevent_ai_telemetry_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'ai_telemetry is append-only. % is not allowed.', TG_OP
    USING ERRCODE = '55000';
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_telemetry_no_update_delete ON public.ai_telemetry;
CREATE TRIGGER trg_ai_telemetry_no_update_delete
BEFORE UPDATE OR DELETE ON public.ai_telemetry
FOR EACH ROW
EXECUTE FUNCTION public.prevent_ai_telemetry_mutation();

COMMENT ON TABLE public.ai_telemetry
IS 'Append-only telemetry for AI agent runs (latency, token usage, JSON success/failure reasons).';

COMMIT;

