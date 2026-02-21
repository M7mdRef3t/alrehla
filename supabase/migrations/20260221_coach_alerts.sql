-- Migration: Coach Automated Dispatcher
-- Stores alerts triggered by AI for coaches to review

create table if not exists public.coach_alerts (
    id uuid primary key default gen_random_uuid(),
    coach_id uuid not null references auth.users(id) on delete cascade,
    client_id uuid not null references auth.users(id) on delete cascade,
    alert_type text not null, -- 'HIGH_ENTROPY', 'SUDDEN_CHAOS', 'ENGAGEMENT_DROP'
    message text not null,
    severity text not null default 'medium', -- 'low', 'medium', 'high', 'critical'
    is_read boolean not null default false,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz not null default now()
);

-- Indexing
create index if not exists idx_coach_alerts_coach on public.coach_alerts(coach_id, is_read);
create index if not exists idx_coach_alerts_client on public.coach_alerts(client_id);

-- RLS
alter table public.coach_alerts enable row level security;

create policy "Coaches can view their own alerts"
    on public.coach_alerts for select
    using (auth.uid() = coach_id);

create policy "Coaches can update their own alerts"
    on public.coach_alerts for update
    using (auth.uid() = coach_id);

-- Allow triggering via function / service
create policy "Users can insert alerts (service-side trigger)"
    on public.coach_alerts for insert
    with check (true); 
