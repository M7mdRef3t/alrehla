-- Influence Maps: Longitudinal network of cross-domain correlations
create table if not exists public.influence_maps (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    snapshot_date timestamptz not null default now(),
    nodes jsonb not null, -- Array of { id, label, type, weight }
    edges jsonb not null, -- Array of { source, target, strength, confidence }
    metadata jsonb default '{}'::jsonb
);

-- RLS Policies
alter table public.influence_maps enable row level security;

create policy "influence_maps_select_own" on public.influence_maps
    for select using (auth.uid() = user_id);

create policy "influence_maps_service_role" on public.influence_maps
    for all using (auth.role() = 'service_role');

-- Index for timeline
create index if not exists influence_maps_user_date_idx on public.influence_maps (user_id, snapshot_date desc);
