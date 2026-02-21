-- Dynamic Routing V2.1 (Knowledge Graph + Swarm + Precompute Cache)
-- Safe, additive migration. No destructive changes.

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'active',
  title text not null,
  content_type text not null default 'exercise',
  lang text not null default 'ar',
  estimated_minutes integer not null default 5,
  difficulty smallint not null default 3,
  cognitive_load_required smallint not null default 3,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(768),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_items_status_idx on public.content_items(status);
create index if not exists content_items_type_idx on public.content_items(content_type);
create index if not exists content_items_lang_idx on public.content_items(lang);
create index if not exists content_items_updated_at_idx on public.content_items(updated_at desc);
create index if not exists content_items_embedding_cosine_idx
  on public.content_items
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

drop trigger if exists content_items_set_updated_at on public.content_items;
create trigger content_items_set_updated_at
before update on public.content_items
for each row execute function public.set_updated_at();

create table if not exists public.content_tags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  tag_group text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.content_item_tags (
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  tag_id uuid not null references public.content_tags(id) on delete cascade,
  weight numeric(5,4) not null default 1.0000,
  created_at timestamptz not null default now(),
  primary key (content_item_id, tag_id)
);

create table if not exists public.knowledge_nodes (
  id uuid primary key default gen_random_uuid(),
  node_type text not null, -- content|concept|goal|state|person
  ref_id text,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists knowledge_nodes_type_ref_idx
  on public.knowledge_nodes(node_type, ref_id);

create table if not exists public.knowledge_edges (
  id uuid primary key default gen_random_uuid(),
  from_node_id uuid not null references public.knowledge_nodes(id) on delete cascade,
  to_node_id uuid not null references public.knowledge_nodes(id) on delete cascade,
  edge_type text not null, -- helps_with|prerequisite|similar_to|contraindicated_for
  base_weight numeric(8,5) not null default 1.00000,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists knowledge_edges_from_edge_active_idx
  on public.knowledge_edges(from_node_id, edge_type, active);
create index if not exists knowledge_edges_to_edge_active_idx
  on public.knowledge_edges(to_node_id, edge_type, active);

create table if not exists public.routing_events (
  id bigint generated always as identity primary key,
  user_id uuid,
  session_id text,
  event_type text not null,
  payload jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists routing_events_session_idx
  on public.routing_events(session_id, occurred_at desc);
create index if not exists routing_events_user_idx
  on public.routing_events(user_id, occurred_at desc);
create index if not exists routing_events_type_idx
  on public.routing_events(event_type, occurred_at desc);

create table if not exists public.swarm_edge_stats (
  id bigint generated always as identity primary key,
  edge_id uuid not null references public.knowledge_edges(id) on delete cascade,
  segment_key text not null,
  trials bigint not null default 0,
  successes bigint not null default 0,
  avg_completion numeric(6,5) not null default 0,
  decay_factor numeric(6,5) not null default 1.00000,
  exploration_count bigint not null default 0,
  last_updated timestamptz not null default now(),
  unique (edge_id, segment_key)
);

create index if not exists swarm_edge_stats_edge_segment_idx
  on public.swarm_edge_stats(edge_id, segment_key);

create table if not exists public.routing_candidate_cache (
  id bigint generated always as identity primary key,
  segment_key text not null,
  source_node_id uuid,
  candidate_content_id uuid not null references public.content_items(id) on delete cascade,
  edge_id uuid references public.knowledge_edges(id) on delete set null,
  base_score numeric(9,6) not null default 0,
  reason_codes text[] not null default '{}',
  computed_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '6 hours')
);

create index if not exists routing_candidate_cache_lookup_idx
  on public.routing_candidate_cache(segment_key, source_node_id, expires_at desc);
create index if not exists routing_candidate_cache_expiry_idx
  on public.routing_candidate_cache(expires_at);

create table if not exists public.routing_decisions_v2 (
  id text primary key,
  user_id uuid,
  session_id text,
  surface text not null default 'map',
  source text not null default 'cloud_ranker_v2',
  segment_key text not null,
  confidence numeric(6,5) not null default 0,
  is_exploration boolean not null default false,
  cognitive_capacity numeric(6,5),
  context jsonb not null default '{}'::jsonb,
  candidates jsonb not null default '[]'::jsonb,
  chosen_step jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists routing_decisions_v2_user_idx
  on public.routing_decisions_v2(user_id, created_at desc);
create index if not exists routing_decisions_v2_session_idx
  on public.routing_decisions_v2(session_id, created_at desc);

create table if not exists public.routing_outcomes_v2 (
  id bigint generated always as identity primary key,
  decision_id text references public.routing_decisions_v2(id) on delete set null,
  user_id uuid,
  acted boolean not null default false,
  completed boolean,
  completion_latency_sec numeric,
  pulse_delta numeric,
  reported_at timestamptz not null default now()
);

create index if not exists routing_outcomes_v2_decision_idx
  on public.routing_outcomes_v2(decision_id, reported_at desc);
create index if not exists routing_outcomes_v2_user_idx
  on public.routing_outcomes_v2(user_id, reported_at desc);

create or replace function public.decayed_success_score(
  in_trials bigint,
  in_successes bigint,
  in_avg_completion numeric,
  in_decay_factor numeric
)
returns numeric
language sql
immutable
as $$
  select
    case
      when coalesce(in_trials, 0) <= 0 then 0::numeric
      else (
        (coalesce(in_successes, 0)::numeric / greatest(in_trials, 1)::numeric) * 0.7
        + coalesce(in_avg_completion, 0) * 0.3
      ) * coalesce(in_decay_factor, 1)
    end;
$$;

create or replace function public.apply_daily_swarm_decay(default_decay numeric default 0.98)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer := 0;
begin
  update public.swarm_edge_stats
  set
    decay_factor = greatest(0.50, least(1.00, coalesce(decay_factor, 1.00) * default_decay)),
    last_updated = now()
  where last_updated < now() - interval '24 hours';

  get diagnostics affected = row_count;
  return affected;
end;
$$;

create or replace function public.increment_swarm_exploration_count(
  in_edge_id uuid,
  in_segment_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.swarm_edge_stats (edge_id, segment_key, exploration_count, last_updated)
  values (in_edge_id, in_segment_key, 1, now())
  on conflict (edge_id, segment_key) do update
    set exploration_count = public.swarm_edge_stats.exploration_count + 1,
        last_updated = now();
end;
$$;

create or replace function public.update_swarm_edge_stats_after_outcome(
  in_edge_id uuid,
  in_segment_key text,
  in_acted boolean,
  in_completed boolean,
  in_completion_latency_sec numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  add_success integer := 0;
  completion_score numeric := 0;
begin
  add_success := case when in_acted and in_completed then 1 else 0 end;
  completion_score := case
    when in_acted and in_completed and in_completion_latency_sec is not null
      then greatest(0, least(1, 1 - (in_completion_latency_sec / 3600)))
    when in_acted and in_completed then 1
    else 0
  end;

  insert into public.swarm_edge_stats (
    edge_id, segment_key, trials, successes, avg_completion, last_updated
  ) values (
    in_edge_id, in_segment_key, 1, add_success, completion_score, now()
  )
  on conflict (edge_id, segment_key) do update
    set trials = public.swarm_edge_stats.trials + 1,
        successes = public.swarm_edge_stats.successes + add_success,
        avg_completion = (
          (public.swarm_edge_stats.avg_completion * public.swarm_edge_stats.trials) + completion_score
        ) / greatest(1, public.swarm_edge_stats.trials + 1),
        decay_factor = least(1.0, public.swarm_edge_stats.decay_factor + case when add_success = 1 then 0.01 else 0 end),
        last_updated = now();
end;
$$;

-- Enable RLS
alter table public.content_items enable row level security;
alter table public.content_tags enable row level security;
alter table public.content_item_tags enable row level security;
alter table public.knowledge_nodes enable row level security;
alter table public.knowledge_edges enable row level security;
alter table public.routing_events enable row level security;
alter table public.swarm_edge_stats enable row level security;
alter table public.routing_candidate_cache enable row level security;
alter table public.routing_decisions_v2 enable row level security;
alter table public.routing_outcomes_v2 enable row level security;

-- Public read for active content only
drop policy if exists content_items_public_select on public.content_items;
create policy content_items_public_select on public.content_items
  for select
  using (status = 'active');

drop policy if exists content_items_service_role_all on public.content_items;
create policy content_items_service_role_all on public.content_items
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Metadata and graph tables are service-managed in MVP
drop policy if exists content_tags_service_role_all on public.content_tags;
create policy content_tags_service_role_all on public.content_tags
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists content_item_tags_service_role_all on public.content_item_tags;
create policy content_item_tags_service_role_all on public.content_item_tags
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists knowledge_nodes_service_role_all on public.knowledge_nodes;
create policy knowledge_nodes_service_role_all on public.knowledge_nodes
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists knowledge_edges_service_role_all on public.knowledge_edges;
create policy knowledge_edges_service_role_all on public.knowledge_edges
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists routing_events_service_role_all on public.routing_events;
create policy routing_events_service_role_all on public.routing_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists swarm_edge_stats_service_role_all on public.swarm_edge_stats;
create policy swarm_edge_stats_service_role_all on public.swarm_edge_stats
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists routing_candidate_cache_service_role_all on public.routing_candidate_cache;
create policy routing_candidate_cache_service_role_all on public.routing_candidate_cache
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists routing_decisions_v2_service_role_all on public.routing_decisions_v2;
create policy routing_decisions_v2_service_role_all on public.routing_decisions_v2
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists routing_outcomes_v2_service_role_all on public.routing_outcomes_v2;
create policy routing_outcomes_v2_service_role_all on public.routing_outcomes_v2
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- End-user can only read own decisions/outcomes when authenticated
drop policy if exists routing_decisions_v2_user_select on public.routing_decisions_v2;
create policy routing_decisions_v2_user_select on public.routing_decisions_v2
  for select
  using (auth.uid() = user_id);

drop policy if exists routing_outcomes_v2_user_select on public.routing_outcomes_v2;
create policy routing_outcomes_v2_user_select on public.routing_outcomes_v2
  for select
  using (auth.uid() = user_id);
