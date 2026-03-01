-- Shadow Signals: Detecting neglected potentials and blind spots
create table if not exists public.shadow_signals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    target_type text not null, -- 'circle', 'action_type'
    target_id text not null,   -- node label or action_id
    shadow_score numeric(5,2) not null,
    insight_text text not null,
    surfaced boolean not null default false,
    acknowledged boolean not null default false,
    created_at timestamptz not null default now()
);

-- RLS Policies
alter table public.shadow_signals enable row level security;

create policy "shadow_signals_select_own" on public.shadow_signals
    for select using (auth.uid() = user_id);

create policy "shadow_signals_update_own" on public.shadow_signals
    for update using (auth.uid() = user_id);

-- Only service role can insert/process
create policy "shadow_signals_service_role" on public.shadow_signals
    for all using (auth.role() = 'service_role');

-- Index for surfacing
create index if not exists shadow_signals_user_active_idx on public.shadow_signals (user_id) where (acknowledged = false);
