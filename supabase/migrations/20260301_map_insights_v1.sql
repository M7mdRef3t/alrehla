-- Create map_insights table
create table if not exists public.map_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  map_hash text not null,
  mode text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  pinned boolean not null default false,
  latency_ms int,
  source text not null default 'gemini', -- 'gemini' | 'cached'
  cache_hit boolean not null default false
);

-- Enable RLS
alter table public.map_insights enable row level security;

-- Policies
create policy "insights_select_own" on public.map_insights
  for select using (auth.uid() = user_id);

create policy "insights_update_own" on public.map_insights
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "insights_delete_own" on public.map_insights
  for delete using (auth.uid() = user_id);

-- Disable direct insert from client for extra security (only server/admin role)

-- Indexes for performance
create index if not exists idx_map_insights_user_created on public.map_insights (user_id, created_at desc);
create index if not exists idx_map_insights_cache_lookup on public.map_insights (user_id, map_hash, mode, created_at desc);

-- Secure ai_usage_logs
alter table public.ai_usage_logs enable row level security;
drop policy if exists "no_client_access_ai_usage_logs" on public.ai_usage_logs;
create policy "no_client_access_ai_usage_logs"
  on public.ai_usage_logs
  for all using (false) with check (false);
