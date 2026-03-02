-- Stability Snapshots: Tracking volatility and stability across circles and relations
create table if not exists public.stability_snapshots (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    window_days integer not null default 30,
    computed_at timestamptz not null default now(),
    node_stability jsonb not null, -- Array of { id, label, stability_score, volatility_score, trend }
    edge_stability jsonb not null, -- Array of { source, target, stability_score, volatility_score, trend }
    metadata jsonb default '{}'::jsonb
);

-- RLS Policies
alter table public.stability_snapshots enable row level security;

create policy "stability_snapshots_select_own" on public.stability_snapshots
    for select using (auth.uid() = user_id);

create policy "stability_snapshots_service_role" on public.stability_snapshots
    for all using (auth.role() = 'service_role');

-- Index for timeline
create index if not exists stability_snapshots_user_date_idx on public.stability_snapshots (user_id, computed_at desc);
