-- Shared Artifacts: Targeted, ephemeral sharing of evolution snapshots
create table if not exists public.shared_artifacts (
    id uuid primary key default gen_random_uuid(),
    owner_user_id uuid references auth.users(id) on delete cascade not null,
    artifact_type text not null default 'evolution_report',
    payload jsonb not null, -- The filtered snapshot data
    created_at timestamptz not null default now(),
    expires_at timestamptz not null,
    revoked_at timestamptz,
    metadata jsonb default '{}'::jsonb
);

-- RLS Policies
alter table public.shared_artifacts enable row level security;

-- Public can select IF NOT EXPIRED and NOT REVOKED
create policy "shared_artifacts_public_select" on public.shared_artifacts
    for select using (
        now() < expires_at 
        and revoked_at is null
    );

-- Owners can do everything
create policy "shared_artifacts_owner_all" on public.shared_artifacts
    for all using (auth.uid() = owner_user_id);

-- Index for lookup
create index if not exists shared_artifacts_owner_idx on public.shared_artifacts (owner_user_id, created_at desc);
create index if not exists shared_artifacts_expiry_idx on public.shared_artifacts (expires_at);
