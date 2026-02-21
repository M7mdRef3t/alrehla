-- Day 1 Observability - Dynamic Routing V2
-- Project: Dawayir Live Agent
-- Run in Supabase SQL Editor.

-- ------------------------------------------------------------
-- 0) Window helper (edit as needed)
-- ------------------------------------------------------------
-- Default window: last 24 hours
with params as (
  select now() - interval '24 hours' as since_ts
)
select since_ts from params;

-- ------------------------------------------------------------
-- 1) Cache/Fallback Health
-- Goal: fallback should stay low (ideally <= 2-5%)
-- ------------------------------------------------------------
with params as (
  select now() - interval '24 hours' as since_ts
),
decisions as (
  select *
  from public.routing_decisions_v2 d
  where d.created_at >= (select since_ts from params)
)
select
  count(*) as total_decisions,
  count(*) filter (where source = 'cloud_ranker_v2') as v2_decisions,
  count(*) filter (where source in ('template_fallback', 'local_policy')) as fallback_decisions,
  round(
    100.0 * count(*) filter (where source in ('template_fallback', 'local_policy')) / nullif(count(*), 0),
    2
  ) as fallback_rate_pct
from decisions;

-- ------------------------------------------------------------
-- 2) Exploration Health
-- Goal: exploration active and measurable (~15% with variance)
-- ------------------------------------------------------------
with params as (
  select now() - interval '24 hours' as since_ts
),
decisions as (
  select id, is_exploration, created_at
  from public.routing_decisions_v2
  where created_at >= (select since_ts from params)
),
outcomes as (
  select decision_id, acted, completed, completion_latency_sec
  from public.routing_outcomes_v2
  where reported_at >= (select since_ts from params)
)
select
  d.is_exploration,
  count(*) as decisions,
  round(100.0 * count(*) / sum(count(*)) over (), 2) as decision_share_pct,
  count(*) filter (where o.acted is true) as acted_count,
  count(*) filter (where o.completed is true) as completed_count,
  round(100.0 * count(*) filter (where o.completed is true) / nullif(count(*), 0), 2) as completion_rate_pct,
  round(avg(o.completion_latency_sec)::numeric, 2) as avg_completion_latency_sec
from decisions d
left join outcomes o
  on o.decision_id = d.id
group by d.is_exploration
order by d.is_exploration desc;

-- ------------------------------------------------------------
-- 3) Cognitive Penalty Effectiveness
-- Goal: low cognitiveCapacity should bias toward lower cognitive load.
-- ------------------------------------------------------------
with params as (
  select now() - interval '24 hours' as since_ts
),
decisions as (
  select
    d.id,
    d.context,
    d.chosen_step
  from public.routing_decisions_v2 d
  where d.created_at >= (select since_ts from params)
),
expanded as (
  select
    id,
    coalesce((context ->> 'cognitiveCapacity')::numeric, null) as cognitive_capacity,
    coalesce((chosen_step -> 'actionPayload' ->> 'contentId')::uuid, null) as content_id
  from decisions
),
joined as (
  select
    e.id,
    e.cognitive_capacity,
    c.cognitive_load_required,
    c.estimated_minutes
  from expanded e
  left join public.content_items c
    on c.id = e.content_id
)
select
  case
    when cognitive_capacity is null then 'unknown'
    when cognitive_capacity < 0.35 then 'low_capacity'
    when cognitive_capacity < 0.65 then 'mid_capacity'
    else 'high_capacity'
  end as capacity_band,
  count(*) as decisions,
  round(avg(cognitive_load_required)::numeric, 2) as avg_selected_cognitive_load,
  round(avg(estimated_minutes)::numeric, 2) as avg_selected_minutes
from joined
group by 1
order by 1;

-- ------------------------------------------------------------
-- 4) Capacity x Completion matrix (does penalty help completion?)
-- ------------------------------------------------------------
with params as (
  select now() - interval '24 hours' as since_ts
),
base as (
  select
    d.id as decision_id,
    case
      when coalesce((d.context ->> 'cognitiveCapacity')::numeric, 0.5) < 0.35 then 'low_capacity'
      when coalesce((d.context ->> 'cognitiveCapacity')::numeric, 0.5) < 0.65 then 'mid_capacity'
      else 'high_capacity'
    end as capacity_band,
    c.cognitive_load_required,
    o.completed
  from public.routing_decisions_v2 d
  left join public.routing_outcomes_v2 o
    on o.decision_id = d.id
  left join public.content_items c
    on c.id = coalesce((d.chosen_step -> 'actionPayload' ->> 'contentId')::uuid, null)
  where d.created_at >= (select since_ts from params)
)
select
  capacity_band,
  case
    when cognitive_load_required is null then 'unknown_load'
    when cognitive_load_required <= 2 then 'low_load'
    when cognitive_load_required = 3 then 'mid_load'
    else 'high_load'
  end as selected_load_band,
  count(*) as decisions,
  count(*) filter (where completed is true) as completed_count,
  round(100.0 * count(*) filter (where completed is true) / nullif(count(*), 0), 2) as completion_rate_pct
from base
group by 1, 2
order by 1, 2;

-- ------------------------------------------------------------
-- 5) Segment coverage health (do we miss key segments?)
-- ------------------------------------------------------------
with params as (
  select now() - interval '24 hours' as since_ts
),
decisions as (
  select segment_key, count(*) as decisions
  from public.routing_decisions_v2
  where created_at >= (select since_ts from params)
  group by segment_key
),
cache as (
  select segment_key, count(*) as cached_candidates
  from public.routing_candidate_cache
  where expires_at > now()
  group by segment_key
)
select
  coalesce(d.segment_key, c.segment_key) as segment_key,
  coalesce(d.decisions, 0) as decisions_24h,
  coalesce(c.cached_candidates, 0) as active_cached_candidates
from decisions d
full join cache c
  on c.segment_key = d.segment_key
order by decisions_24h desc, active_cached_candidates asc;
