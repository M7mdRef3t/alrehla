create extension if not exists pgcrypto;

create table if not exists public.maraya_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  anon_id text not null unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maraya_mirror_memory (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.maraya_profiles(id) on delete set null,
  user_id text not null unique,
  journeys jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maraya_duo_rooms (
  id text primary key,
  host_profile_id uuid references public.maraya_profiles(id) on delete set null,
  status text not null default 'waiting',
  story_started boolean not null default false,
  current_scene_version integer not null default 0,
  current_emotion text not null default 'hope',
  output_mode text not null default 'judge_en',
  pending_vote jsonb,
  room_state jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maraya_duo_room_members (
  room_id text not null references public.maraya_duo_rooms(id) on delete cascade,
  profile_id uuid references public.maraya_profiles(id) on delete cascade,
  anon_id text not null,
  session_id text not null,
  role text not null check (role in ('host', 'guest')),
  display_name text not null,
  connected boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (room_id, session_id)
);

create table if not exists public.maraya_scene_assets (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  scene_id text not null,
  image_path text,
  audio_path text,
  scene_version integer not null default 0,
  mime text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, scene_id, scene_version)
);

create table if not exists public.maraya_artifacts (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  profile_id uuid references public.maraya_profiles(id) on delete set null,
  artifact_type text not null,
  storage_path text,
  share_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maraya_telemetry (
  id bigint generated always as identity primary key,
  session_id text,
  profile_id uuid references public.maraya_profiles(id) on delete set null,
  event_name text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.maraya_mirror_memory
  add column if not exists profile_id uuid references public.maraya_profiles(id) on delete set null;

alter table public.maraya_duo_rooms
  add column if not exists host_session_id text,
  add column if not exists host_profile_id uuid references public.maraya_profiles(id) on delete set null,
  add column if not exists status text not null default 'waiting',
  add column if not exists current_scene_version integer not null default 0,
  add column if not exists current_emotion text not null default 'hope',
  add column if not exists output_mode text not null default 'judge_en',
  add column if not exists room_state jsonb not null default '{}'::jsonb;

alter table public.maraya_scene_assets
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

alter table public.maraya_artifacts
  add column if not exists share_id text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists maraya_profiles_anon_idx on public.maraya_profiles(anon_id);
create index if not exists maraya_mirror_memory_user_idx on public.maraya_mirror_memory(user_id);
create index if not exists maraya_duo_rooms_status_idx on public.maraya_duo_rooms(status, updated_at desc);
create index if not exists maraya_duo_rooms_expires_idx on public.maraya_duo_rooms(expires_at);
create index if not exists maraya_duo_room_members_room_idx on public.maraya_duo_room_members(room_id, connected);
create index if not exists maraya_duo_room_members_anon_idx on public.maraya_duo_room_members(anon_id, updated_at desc);
create index if not exists maraya_scene_assets_session_idx on public.maraya_scene_assets(session_id, scene_version desc);
create index if not exists maraya_artifacts_session_idx on public.maraya_artifacts(session_id, artifact_type);
create index if not exists maraya_telemetry_session_idx on public.maraya_telemetry(session_id, created_at desc);

alter table public.maraya_profiles enable row level security;
alter table public.maraya_mirror_memory enable row level security;
alter table public.maraya_duo_rooms enable row level security;
alter table public.maraya_duo_room_members enable row level security;
alter table public.maraya_scene_assets enable row level security;
alter table public.maraya_artifacts enable row level security;
alter table public.maraya_telemetry enable row level security;

drop policy if exists "maraya anonymous read profiles" on public.maraya_profiles;
create policy "maraya anonymous read profiles"
on public.maraya_profiles
for select
using (true);

drop policy if exists "maraya anonymous write profiles" on public.maraya_profiles;
create policy "maraya anonymous write profiles"
on public.maraya_profiles
for all
using (true)
with check (true);

drop policy if exists "maraya anonymous read mirror memory" on public.maraya_mirror_memory;
create policy "maraya anonymous read mirror memory"
on public.maraya_mirror_memory
for select
using (true);

drop policy if exists "maraya anonymous write mirror memory" on public.maraya_mirror_memory;
create policy "maraya anonymous write mirror memory"
on public.maraya_mirror_memory
for all
using (true)
with check (true);

drop policy if exists "maraya anonymous read duo rooms" on public.maraya_duo_rooms;
create policy "maraya anonymous read duo rooms"
on public.maraya_duo_rooms
for select
using (true);

drop policy if exists "maraya anonymous write duo rooms" on public.maraya_duo_rooms;
create policy "maraya anonymous write duo rooms"
on public.maraya_duo_rooms
for all
using (true)
with check (true);

drop policy if exists "maraya anonymous read duo members" on public.maraya_duo_room_members;
create policy "maraya anonymous read duo members"
on public.maraya_duo_room_members
for select
using (true);

drop policy if exists "maraya anonymous write duo members" on public.maraya_duo_room_members;
create policy "maraya anonymous write duo members"
on public.maraya_duo_room_members
for all
using (true)
with check (true);

drop policy if exists "maraya anonymous read scene assets" on public.maraya_scene_assets;
create policy "maraya anonymous read scene assets"
on public.maraya_scene_assets
for select
using (true);

drop policy if exists "maraya anonymous write scene assets" on public.maraya_scene_assets;
create policy "maraya anonymous write scene assets"
on public.maraya_scene_assets
for all
using (true)
with check (true);

drop policy if exists "maraya anonymous read artifacts" on public.maraya_artifacts;
create policy "maraya anonymous read artifacts"
on public.maraya_artifacts
for select
using (true);

drop policy if exists "maraya anonymous write artifacts" on public.maraya_artifacts;
create policy "maraya anonymous write artifacts"
on public.maraya_artifacts
for all
using (true)
with check (true);

drop policy if exists "maraya anonymous write telemetry" on public.maraya_telemetry;
create policy "maraya anonymous write telemetry"
on public.maraya_telemetry
for insert
with check (true);

drop policy if exists "maraya anonymous read telemetry" on public.maraya_telemetry;
create policy "maraya anonymous read telemetry"
on public.maraya_telemetry
for select
using (true);

insert into storage.buckets (id, name, public)
values ('maraya-scenes', 'maraya-scenes', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('maraya-audio', 'maraya-audio', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('maraya-artifacts', 'maraya-artifacts', false)
on conflict (id) do nothing;

drop policy if exists "maraya storage read" on storage.objects;
create policy "maraya storage read"
on storage.objects
for select
using (
  bucket_id in ('maraya-scenes', 'maraya-audio', 'maraya-artifacts')
);

drop policy if exists "maraya storage write" on storage.objects;
create policy "maraya storage write"
on storage.objects
for all
using (
  bucket_id in ('maraya-scenes', 'maraya-audio', 'maraya-artifacts')
)
with check (
  bucket_id in ('maraya-scenes', 'maraya-audio', 'maraya-artifacts')
);
