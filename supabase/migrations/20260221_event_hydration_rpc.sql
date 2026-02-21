-- SQL-native event hydration helpers (Window Functions)
-- Compute near storage: infer task/content stats and graph edges from journey_events.

create or replace function public.infer_event_tasks(
  in_max_rows integer default 200000
)
returns table (
  task_key text,
  path_id text,
  task_id text,
  task_label text,
  starts bigint,
  completes bigint,
  avg_latency_ms numeric,
  completion_rate numeric
)
language sql
security definer
set search_path = public
as $$
with ordered as (
  select
    coalesce(nullif(trim(session_id), ''), 'anonymous') as actor_key,
    created_at,
    type as event_type,
    coalesce(nullif(trim(payload->>'pathId'), ''), 'legacy_path') as path_id,
    coalesce(nullif(trim(payload->>'taskId'), ''), 'legacy_task') as task_id,
    coalesce(
      nullif(trim(payload->>'taskLabel'), ''),
      nullif(trim(payload->>'taskId'), ''),
      'Legacy Task'
    ) as task_label,
    lag(type) over (
      partition by coalesce(nullif(trim(session_id), ''), 'anonymous'),
                   coalesce(nullif(trim(payload->>'pathId'), ''), 'legacy_path'),
                   coalesce(nullif(trim(payload->>'taskId'), ''), 'legacy_task')
      order by created_at
    ) as prev_event_type,
    lag(created_at) over (
      partition by coalesce(nullif(trim(session_id), ''), 'anonymous'),
                   coalesce(nullif(trim(payload->>'pathId'), ''), 'legacy_path'),
                   coalesce(nullif(trim(payload->>'taskId'), ''), 'legacy_task')
      order by created_at
    ) as prev_created_at
  from public.journey_events
  where type in ('task_started', 'task_completed')
  order by created_at desc
  limit greatest(in_max_rows, 1000)
),
latency_pairs as (
  select
    path_id,
    task_id,
    task_label,
    extract(epoch from (created_at - prev_created_at)) * 1000 as latency_ms
  from ordered
  where event_type = 'task_completed'
    and prev_event_type = 'task_started'
    and prev_created_at is not null
    and created_at >= prev_created_at
),
agg_base as (
  select
    path_id,
    task_id,
    max(task_label) as task_label,
    count(*) filter (where event_type = 'task_started') as starts,
    count(*) filter (where event_type = 'task_completed') as completes
  from ordered
  group by path_id, task_id
),
agg_latency as (
  select
    path_id,
    task_id,
    avg(latency_ms)::numeric as avg_latency_ms
  from latency_pairs
  group by path_id, task_id
)
select
  concat(a.path_id, '|', a.task_id) as task_key,
  a.path_id,
  a.task_id,
  a.task_label,
  a.starts,
  a.completes,
  coalesce(l.avg_latency_ms, 300000::numeric) as avg_latency_ms,
  case when a.starts > 0 then (a.completes::numeric / a.starts::numeric) else 0::numeric end as completion_rate
from agg_base a
left join agg_latency l
  on l.path_id = a.path_id
 and l.task_id = a.task_id;
$$;

create or replace function public.infer_event_edges(
  in_max_rows integer default 200000,
  in_max_gap_seconds integer default 86400,
  in_min_support integer default 1
)
returns table (
  source_task text,
  target_task text,
  support_count bigint,
  avg_gap_seconds numeric
)
language sql
security definer
set search_path = public
as $$
with ordered as (
  select
    coalesce(nullif(trim(session_id), ''), 'anonymous') as actor_key,
    created_at,
    type as event_type,
    concat(
      coalesce(nullif(trim(payload->>'pathId'), ''), 'legacy_path'),
      '|',
      coalesce(nullif(trim(payload->>'taskId'), ''), 'legacy_task')
    ) as task_key,
    lead(type) over (
      partition by coalesce(nullif(trim(session_id), ''), 'anonymous')
      order by created_at
    ) as next_event_type,
    lead(created_at) over (
      partition by coalesce(nullif(trim(session_id), ''), 'anonymous')
      order by created_at
    ) as next_created_at,
    lead(
      concat(
        coalesce(nullif(trim(payload->>'pathId'), ''), 'legacy_path'),
        '|',
        coalesce(nullif(trim(payload->>'taskId'), ''), 'legacy_task')
      )
    ) over (
      partition by coalesce(nullif(trim(session_id), ''), 'anonymous')
      order by created_at
    ) as next_task_key
  from public.journey_events
  where type in ('task_started', 'task_completed')
  order by created_at desc
  limit greatest(in_max_rows, 1000)
),
edges as (
  select
    task_key as source_task,
    next_task_key as target_task,
    extract(epoch from (next_created_at - created_at)) as gap_seconds
  from ordered
  where event_type = 'task_completed'
    and next_event_type = 'task_started'
    and task_key <> next_task_key
    and next_created_at is not null
    and extract(epoch from (next_created_at - created_at)) between 0 and in_max_gap_seconds
)
select
  source_task,
  target_task,
  count(*) as support_count,
  avg(gap_seconds)::numeric as avg_gap_seconds
from edges
group by source_task, target_task
having count(*) >= greatest(in_min_support, 1);
$$;
