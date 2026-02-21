-- Migration: Shadow Memory Snapshots
-- AI-Driven automated tracking of user entropy

create table if not exists public.shadow_snapshots (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    entropy_score integer not null,
    state text not null, -- 'CHAOS', 'ORDER', 'FLOW'
    primary_factor text,
    timestamp timestamptz not null default now()
);

-- Indexing for time-series analysis
create index if not exists idx_shadow_snapshots_user_time on public.shadow_snapshots(user_id, timestamp desc);

-- RLS
alter table public.shadow_snapshots enable row level security;

create policy "Users can view their own snapshots"
    on public.shadow_snapshots for select
    using (auth.uid() = user_id);

create policy "Users can insert their own snapshots"
    on public.shadow_snapshots for insert
    with check (auth.uid() = user_id);

-- Coaches can view snapshots of their clients
create policy "Coaches can view client snapshots"
    on public.shadow_snapshots for select
    using (
        exists (
            select 1 from public.coach_connections
            where coach_id = auth.uid()
            and client_id = public.shadow_snapshots.user_id
            and status = 'active'
        )
    );
