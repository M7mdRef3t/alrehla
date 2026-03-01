-- Contextual Insights: Deep correlations between life areas and states
create table if not exists public.contextual_insights (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    insight_type text not null, -- 'circle_mood_correlation', 'energy_action_pattern', etc.
    title text not null,
    description text not null,
    confidence_score numeric(3,2) not null,
    metadata jsonb default '{}'::jsonb,
    surfaced_at timestamptz not null default now(),
    acknowledged boolean not null default false
);

-- RLS Policies
alter table public.contextual_insights enable row level security;

create policy "contextual_insights_select_own" on public.contextual_insights
    for select using (auth.uid() = user_id);

-- Only service role can insert
create policy "contextual_insights_service_role" on public.contextual_insights
    for all using (auth.role() = 'service_role');

-- Index for surfacing
create index if not exists contextual_insights_user_date_idx on public.contextual_insights (user_id, surfaced_at desc);
