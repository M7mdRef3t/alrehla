-- Micro Actions: The Behavioral Response Layer
create table if not exists public.micro_actions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    intervention_id uuid references public.interventions(id) on delete cascade not null,
    action_type text not null, -- 'rebalance_circles', 'red_orbit_analysis', 'quick_journal', 'reduce_impact'
    executed_at timestamptz default now(),
    metadata jsonb default '{}'::jsonb
);

-- RLS Policies
alter table public.micro_actions enable row level security;

create policy "micro_actions_select_own" on public.micro_actions
    for select using (auth.uid() = user_id);

create policy "micro_actions_insert_own" on public.micro_actions
    for insert with check (auth.uid() = user_id);

-- Index for analytics later
create index if not exists micro_actions_lookup_idx on public.micro_actions (user_id, action_type);
