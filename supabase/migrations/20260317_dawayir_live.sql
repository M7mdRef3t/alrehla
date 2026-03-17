create extension if not exists pgcrypto;

create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  mode text not null default 'standard',
  language text not null default 'ar',
  entry_surface text,
  goal_context jsonb not null default '{}'::jsonb,
  status text not null default 'created',
  summary jsonb,
  metrics jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.live_session_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  seq bigint not null,
  event_type text not null,
  actor text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(session_id, seq)
);

create table if not exists public.live_session_artifacts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  artifact_type text not null,
  title text,
  content jsonb not null default '{}'::jsonb,
  storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(session_id, artifact_type)
);

create table if not exists public.live_replay_frames (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  seq bigint not null,
  frame jsonb not null,
  created_at timestamptz not null default now(),
  unique(session_id, seq)
);

create table if not exists public.live_session_access (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  access_role text not null check (access_role in ('owner', 'partner', 'coach')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(session_id, user_id)
);

create index if not exists live_sessions_owner_idx on public.live_sessions(owner_user_id, updated_at desc);
create index if not exists live_sessions_status_idx on public.live_sessions(status);
create index if not exists live_session_events_session_idx on public.live_session_events(session_id, seq);
create index if not exists live_session_artifacts_session_idx on public.live_session_artifacts(session_id, artifact_type);
create index if not exists live_replay_frames_session_idx on public.live_replay_frames(session_id, seq);
create index if not exists live_session_access_user_idx on public.live_session_access(user_id, access_role);

alter table public.live_sessions enable row level security;
alter table public.live_session_events enable row level security;
alter table public.live_session_artifacts enable row level security;
alter table public.live_replay_frames enable row level security;
alter table public.live_session_access enable row level security;

drop policy if exists "live sessions owner read" on public.live_sessions;
create policy "live sessions owner read"
on public.live_sessions
for select
using (
  owner_user_id = auth.uid()
  or exists (
    select 1
    from public.live_session_access access
    where access.session_id = live_sessions.id
      and access.user_id = auth.uid()
  )
);

drop policy if exists "live sessions owner write" on public.live_sessions;
create policy "live sessions owner write"
on public.live_sessions
for all
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "live session events read" on public.live_session_events;
create policy "live session events read"
on public.live_session_events
for select
using (
  exists (
    select 1
    from public.live_sessions sessions
    left join public.live_session_access access on access.session_id = sessions.id and access.user_id = auth.uid()
    where sessions.id = live_session_events.session_id
      and (sessions.owner_user_id = auth.uid() or access.user_id is not null)
  )
);

drop policy if exists "live session events write" on public.live_session_events;
create policy "live session events write"
on public.live_session_events
for insert
with check (
  exists (
    select 1
    from public.live_sessions sessions
    where sessions.id = live_session_events.session_id
      and sessions.owner_user_id = auth.uid()
  )
);

drop policy if exists "live artifacts read" on public.live_session_artifacts;
create policy "live artifacts read"
on public.live_session_artifacts
for select
using (
  exists (
    select 1
    from public.live_sessions sessions
    left join public.live_session_access access on access.session_id = sessions.id and access.user_id = auth.uid()
    where sessions.id = live_session_artifacts.session_id
      and (sessions.owner_user_id = auth.uid() or access.user_id is not null)
  )
);

drop policy if exists "live artifacts write" on public.live_session_artifacts;
create policy "live artifacts write"
on public.live_session_artifacts
for all
using (
  exists (
    select 1
    from public.live_sessions sessions
    where sessions.id = live_session_artifacts.session_id
      and sessions.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.live_sessions sessions
    where sessions.id = live_session_artifacts.session_id
      and sessions.owner_user_id = auth.uid()
  )
);

drop policy if exists "live replay read" on public.live_replay_frames;
create policy "live replay read"
on public.live_replay_frames
for select
using (
  exists (
    select 1
    from public.live_sessions sessions
    left join public.live_session_access access on access.session_id = sessions.id and access.user_id = auth.uid()
    where sessions.id = live_replay_frames.session_id
      and (sessions.owner_user_id = auth.uid() or access.user_id is not null)
  )
);

drop policy if exists "live replay write" on public.live_replay_frames;
create policy "live replay write"
on public.live_replay_frames
for insert
with check (
  exists (
    select 1
    from public.live_sessions sessions
    where sessions.id = live_replay_frames.session_id
      and sessions.owner_user_id = auth.uid()
  )
);

drop policy if exists "live access read" on public.live_session_access;
create policy "live access read"
on public.live_session_access
for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.live_sessions sessions
    where sessions.id = live_session_access.session_id
      and sessions.owner_user_id = auth.uid()
  )
);

drop policy if exists "live access owner write" on public.live_session_access;
create policy "live access owner write"
on public.live_session_access
for all
using (
  exists (
    select 1
    from public.live_sessions sessions
    where sessions.id = live_session_access.session_id
      and sessions.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.live_sessions sessions
    where sessions.id = live_session_access.session_id
      and sessions.owner_user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('dawayir-live', 'dawayir-live', false)
on conflict (id) do nothing;

drop policy if exists "dawayir live storage read" on storage.objects;
create policy "dawayir live storage read"
on storage.objects
for select
using (
  bucket_id = 'dawayir-live'
  and auth.role() = 'authenticated'
);

drop policy if exists "dawayir live storage write" on storage.objects;
create policy "dawayir live storage write"
on storage.objects
for all
using (
  bucket_id = 'dawayir-live'
  and auth.role() = 'authenticated'
)
with check (
  bucket_id = 'dawayir-live'
  and auth.role() = 'authenticated'
);
