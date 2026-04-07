/* 
  Migration: Unify Legacy Journey Events to Routing Events
  Date: 2026-04-05
  Goal: Consolidate all telemetry into routing_events for Sovereign Dashboard integrity.
*/

-- 1. Migrate Historical Data
-- We use public.journey_events.id as the client_event_id to ensure idempotency.
INSERT INTO public.routing_events (
  user_id,
  session_id,
  event_type,
  payload,
  occurred_at,
  client_event_id
)
SELECT
  NULL::uuid as user_id,
  session_id,
  type as event_type,
  payload,
  created_at as occurred_at,
  id::text as client_event_id
FROM public.journey_events
ON CONFLICT (client_event_id) WHERE client_event_id IS NOT NULL DO NOTHING;

-- 2. Update Hydration RPCs
-- Point infer_event_tasks to routing_events
CREATE OR REPLACE FUNCTION public.infer_event_tasks(
  in_max_rows integer default 200000
)
RETURNS TABLE (
  task_key text,
  path_id text,
  task_id text,
  task_label text,
  starts bigint,
  completes bigint,
  avg_latency_ms numeric,
  completion_rate numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
WITH ordered AS (
  SELECT
    COALESCE(NULLIF(TRIM(session_id), ''), 'anonymous') as actor_key,
    occurred_at as created_at,
    event_type,
    COALESCE(NULLIF(TRIM(payload->>'pathId'), ''), 'legacy_path') as path_id,
    COALESCE(NULLIF(TRIM(payload->>'taskId'), ''), 'legacy_task') as task_id,
    COALESCE(
      NULLIF(TRIM(payload->>'taskLabel'), ''),
      NULLIF(TRIM(payload->>'taskId'), ''),
      'Legacy Task'
    ) as task_label,
    LAG(event_type) OVER (
      PARTITION BY COALESCE(NULLIF(TRIM(session_id), ''), 'anonymous'),
                   COALESCE(NULLIF(TRIM(payload->>'pathId'), ''), 'legacy_path'),
                   COALESCE(NULLIF(TRIM(payload->>'taskId'), ''), 'legacy_task')
      ORDER BY occurred_at
    ) as prev_event_type,
    LAG(occurred_at) OVER (
      PARTITION BY COALESCE(NULLIF(TRIM(session_id), ''), 'anonymous'),
                   COALESCE(NULLIF(TRIM(payload->>'pathId'), ''), 'legacy_path'),
                   COALESCE(NULLIF(TRIM(payload->>'taskId'), ''), 'legacy_task')
      ORDER BY occurred_at
    ) as prev_created_at
  FROM public.routing_events
  WHERE event_type IN ('task_started', 'task_completed')
  ORDER BY occurred_at DESC
  LIMIT GREATEST(in_max_rows, 1000)
),
latency_pairs AS (
  SELECT
    path_id,
    task_id,
    task_label,
    EXTRACT(epoch from (created_at - prev_created_at)) * 1000 as latency_ms
  FROM ordered
  WHERE event_type = 'task_completed'
    AND prev_event_type = 'task_started'
    AND prev_created_at IS NOT NULL
    AND created_at >= prev_created_at
),
agg_base AS (
  SELECT
    path_id,
    task_id,
    MAX(task_label) as task_label,
    COUNT(*) FILTER (where event_type = 'task_started') as starts,
    COUNT(*) FILTER (where event_type = 'task_completed') as completes
  FROM ordered
  GROUP BY path_id, task_id
),
agg_latency AS (
  SELECT
    path_id,
    task_id,
    AVG(latency_ms)::numeric as avg_latency_ms
  FROM latency_pairs
  GROUP BY path_id, task_id
)
SELECT
  CONCAT(a.path_id, '|', a.task_id) as task_key,
  a.path_id,
  a.task_id,
  a.task_label,
  a.starts,
  a.completes,
  COALESCE(l.avg_latency_ms, 300000::numeric) as avg_latency_ms,
  CASE WHEN a.starts > 0 THEN (a.completes::numeric / a.starts::numeric) ELSE 0::numeric END as completion_rate
FROM agg_base a
LEFT JOIN agg_latency l
  ON l.path_id = a.path_id
 AND l.task_id = a.task_id;
$$;

-- Point infer_event_edges to routing_events
CREATE OR REPLACE FUNCTION public.infer_event_edges(
  in_max_rows integer default 200000,
  in_max_gap_seconds integer default 86400,
  in_min_support integer default 1
)
RETURNS TABLE (
  source_task text,
  target_task text,
  support_count bigint,
  avg_gap_seconds numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
WITH ordered AS (
  SELECT
    COALESCE(NULLIF(TRIM(session_id), ''), 'anonymous') as actor_key,
    occurred_at as created_at,
    event_type,
    CONCAT(
      COALESCE(NULLIF(TRIM(payload->>'pathId'), ''), 'legacy_path'),
      '|',
      COALESCE(NULLIF(TRIM(payload->>'taskId'), ''), 'legacy_task')
    ) as task_key,
    LEAD(event_type) OVER (
      PARTITION BY COALESCE(NULLIF(TRIM(session_id), ''), 'anonymous')
      ORDER BY occurred_at
    ) as next_event_type,
    LEAD(occurred_at) OVER (
      PARTITION BY COALESCE(NULLIF(TRIM(session_id), ''), 'anonymous')
      ORDER BY occurred_at
    ) as next_created_at,
    LEAD(
      CONCAT(
        COALESCE(NULLIF(TRIM(payload->>'pathId'), ''), 'legacy_path'),
        '|',
        COALESCE(NULLIF(TRIM(payload->>'taskId'), ''), 'legacy_task')
      )
    ) OVER (
      PARTITION BY COALESCE(NULLIF(TRIM(session_id), ''), 'anonymous')
      ORDER BY occurred_at
    ) as next_task_key
  FROM public.routing_events
  WHERE event_type IN ('task_started', 'task_completed')
  ORDER BY occurred_at DESC
  LIMIT GREATEST(in_max_rows, 1000)
),
edges AS (
  SELECT
    task_key as source_task,
    next_task_key as target_task,
    EXTRACT(epoch from (next_created_at - created_at)) as gap_seconds
  FROM ordered
  WHERE event_type = 'task_completed'
    AND next_event_type = 'task_started'
    AND task_key <> next_task_key
    AND next_created_at IS NOT NULL
    AND EXTRACT(epoch from (next_created_at - created_at)) BETWEEN 0 AND in_max_gap_seconds
)
SELECT
  source_task,
  target_task,
  COUNT(*) as support_count,
  AVG(gap_seconds)::numeric as avg_gap_seconds
FROM edges
GROUP BY source_task, target_task
HAVING COUNT(*) >= GREATEST(in_min_support, 1);
$$;

COMMENT ON FUNCTION public.infer_event_tasks IS 'Hydrates task metrics from unified routing_events.';
COMMENT ON FUNCTION public.infer_event_edges IS 'Hydrates graph edge transitions from unified routing_events.';
