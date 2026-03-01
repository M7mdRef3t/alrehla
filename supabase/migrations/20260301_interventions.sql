-- Interventions: The "Guardian" Layer
create table if not exists public.interventions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    type text not null, -- low_mood_streak, negative_trajectory, stress_overload, energy_crash
    severity text not null default 'medium', -- low, medium, high
    message text not null,
    metadata jsonb default '{}'::jsonb,
    acknowledged boolean not null default false,
    created_at timestamptz not null default now()
);

-- RLS Policies
alter table public.interventions enable row level security;

create policy "interventions_select_own" on public.interventions
    for select using (auth.uid() = user_id);

create policy "interventions_update_own" on public.interventions
    for update using (auth.uid() = user_id);

-- Only service role can insert
create policy "interventions_service_role" on public.interventions
    for insert with check (auth.role() = 'service_role');

-- Index for lookup
create index if not exists interventions_user_active_idx on public.interventions (user_id) where (acknowledged = false);
