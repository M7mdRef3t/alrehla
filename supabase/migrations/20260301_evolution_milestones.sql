-- Evolution Milestones: Celebrating real behavioral breakthroughs
create table if not exists public.evolution_milestones (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    milestone_type text not null, -- 'shadow_breakthrough', 'behavioral_diversity', 'stability_recovery'
    milestone_label text not null,
    metadata jsonb default '{}'::jsonb,
    unlocked_at timestamptz not null default now()
);

-- RLS Policies
alter table public.evolution_milestones enable row level security;

create policy "milestones_select_own" on public.evolution_milestones
    for select using (auth.uid() = user_id);

-- Only service role can insert
create policy "milestones_service_role_all" on public.evolution_milestones
    for all using (auth.role() = 'service_role');

-- Index for timeline fetching
create index if not exists evolution_milestones_user_date_idx on public.evolution_milestones (user_id, unlocked_at desc);
