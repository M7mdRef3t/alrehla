-- =============================================================================
-- Dawayir V2 — تشغيل مرة واحدة في Supabase
-- =============================================================================
-- 1. افتح Supabase → مشروعك → SQL Editor
-- 2. انسخ هذا الملف كاملاً والصقه في الاستعلام
-- 3. اضغط Run
-- 4. بعدها: Database → Replication → فعّل Realtime لجدول app_content
-- 5. (اختياري) لترقية حسابك لـ owner: شغّل الاستعلام في نهاية الملف بعد ما تحط id حسابك
-- =============================================================================

create extension if not exists "pgcrypto";
create extension if not exists vector with schema public;

create table if not exists system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists app_content (
  key text primary key,
  content text not null,
  page text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_content_page_idx on app_content (page);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_content_set_updated_at on app_content;
create trigger app_content_set_updated_at
before update on app_content
for each row execute function public.set_updated_at();

create table if not exists admin_ai_logs (
  id text primary key,
  created_at timestamptz not null default now(),
  prompt text not null,
  response text not null,
  source text not null,
  rating text
);

create table if not exists admin_missions (
  id text primary key,
  title text not null,
  track text not null,
  difficulty text not null,
  created_at timestamptz not null default now()
);

create table if not exists admin_broadcasts (
  id text primary key,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists admin_reports (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists consciousness_vectors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id),
  content text not null,
  embedding vector(768) not null,
  created_at timestamptz not null default now()
);

alter table if exists consciousness_vectors
  add column if not exists source text;

alter table if exists consciousness_vectors
  add column if not exists hidden boolean not null default false,
  add column if not exists tags text[],
  add column if not exists manual_notes text;

create table if not exists journey_events (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  mode text not null default 'anonymous',
  type text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists daily_pulse_logs (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  energy int not null,
  mood text not null,
  focus text not null,
  auto boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists journey_maps (
  session_id text primary key,
  nodes jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists user_state (
  device_token text primary key,
  owner_id uuid,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table user_state add column if not exists owner_id uuid;

create table if not exists profiles (
  id text primary key,
  full_name text,
  email text,
  role text default 'user',
  created_at timestamptz not null default now(),
  last_seen timestamptz
);

create or replace function public.handle_auth_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role, created_at)
  values (
    new.id::text,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'user',
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_profile();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update on auth.users
for each row when (
  old.email is distinct from new.email or
  old.raw_user_meta_data is distinct from new.raw_user_meta_data
)
execute function public.handle_auth_profile();

create index if not exists journey_events_created_at_idx on journey_events (created_at desc);
create index if not exists journey_events_type_idx on journey_events (type);
create index if not exists journey_events_session_idx on journey_events (session_id);
create index if not exists daily_pulse_logs_created_at_idx on daily_pulse_logs (created_at desc);
create index if not exists journey_maps_updated_at_idx on journey_maps (updated_at desc);
create index if not exists user_state_updated_at_idx on user_state (updated_at desc);
create unique index if not exists user_state_owner_idx on user_state (owner_id) where owner_id is not null;
create index if not exists profiles_last_seen_idx on profiles (last_seen desc);
create index if not exists admin_reports_created_at_idx on admin_reports (created_at desc);
create index if not exists consciousness_vectors_embedding_cosine_idx
  on public.consciousness_vectors
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create or replace function public.match_consciousness_vectors(
  query_embedding vector(768),
  match_limit int default 5,
  match_threshold float default 0.2
)
returns table (
  id uuid,
  user_id uuid,
  content text,
  similarity float,
  created_at timestamptz,
  source text,
  tags text[],
  manual_notes text
)
language plpgsql
as $$
begin
  return query
  select
    cv.id,
    cv.user_id,
    cv.content,
    1 - (cv.embedding <=> query_embedding) as similarity,
    cv.created_at,
    cv.source,
    cv.tags,
    cv.manual_notes
  from public.consciousness_vectors as cv
  where cv.hidden is not true
    and 1 - (cv.embedding <=> query_embedding) >= match_threshold
  order by cv.embedding <=> query_embedding
  limit match_limit;
end;
$$;

create or replace function public.get_consciousness_archive(limit_count int default 200)
returns table (
  id uuid,
  user_id uuid,
  content text,
  source text,
  created_at timestamptz,
  tags text[],
  manual_notes text,
  hidden boolean
)
language sql
security definer
set search_path = public
as $$
  select
    cv.id,
    cv.user_id,
    cv.content,
    cv.source,
    cv.created_at,
    cv.tags,
    cv.manual_notes,
    cv.hidden
  from public.consciousness_vectors as cv
  order by cv.created_at desc
  limit limit_count;
$$;

-- ---------- RLS ----------
alter table system_settings enable row level security;
drop policy if exists system_settings_service_role on system_settings;
create policy system_settings_service_role on system_settings for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

alter table admin_ai_logs enable row level security;
drop policy if exists admin_ai_logs_service_role on admin_ai_logs;
create policy admin_ai_logs_service_role on admin_ai_logs for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

alter table admin_missions enable row level security;
drop policy if exists admin_missions_service_role on admin_missions;
create policy admin_missions_service_role on admin_missions for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

alter table admin_broadcasts enable row level security;
drop policy if exists admin_broadcasts_service_role on admin_broadcasts;
create policy admin_broadcasts_service_role on admin_broadcasts for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

alter table admin_reports enable row level security;
drop policy if exists admin_reports_service_role on admin_reports;
create policy admin_reports_service_role on admin_reports for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

alter table consciousness_vectors enable row level security;
drop policy if exists consciousness_vectors_service_role on consciousness_vectors;
create policy consciousness_vectors_service_role on consciousness_vectors for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

alter table journey_events enable row level security;
drop policy if exists journey_events_insert on journey_events;
create policy journey_events_insert on journey_events for insert with check (true);
drop policy if exists journey_events_service_select on journey_events;
create policy journey_events_service_select on journey_events for select using (auth.role() = 'service_role');

alter table daily_pulse_logs enable row level security;
drop policy if exists daily_pulse_logs_insert on daily_pulse_logs;
create policy daily_pulse_logs_insert on daily_pulse_logs for insert with check (true);
drop policy if exists daily_pulse_logs_service_select on daily_pulse_logs;
create policy daily_pulse_logs_service_select on daily_pulse_logs for select using (auth.role() = 'service_role');

alter table journey_maps enable row level security;
drop policy if exists journey_maps_insert on journey_maps;
create policy journey_maps_insert on journey_maps for insert with check (true);
drop policy if exists journey_maps_update on journey_maps;
create policy journey_maps_update on journey_maps for update using (true) with check (true);
drop policy if exists journey_maps_service_select on journey_maps;
create policy journey_maps_service_select on journey_maps for select using (auth.role() = 'service_role');

alter table profiles enable row level security;
drop policy if exists profiles_session_insert on profiles;
create policy profiles_session_insert on profiles for insert with check (coalesce(role, 'session') = 'session');
drop policy if exists profiles_session_update on profiles;
create policy profiles_session_update on profiles for update using (role = 'session') with check (role = 'session');
drop policy if exists profiles_service_select on profiles;
create policy profiles_service_select on profiles for select using (auth.role() = 'service_role');
drop policy if exists profiles_user_select on profiles;
create policy profiles_user_select on profiles for select using (auth.uid()::text = id);
drop policy if exists profiles_user_update on profiles;

alter table user_state enable row level security;
drop policy if exists user_state_service_role on user_state;
create policy user_state_service_role on user_state for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

alter table app_content enable row level security;
drop policy if exists app_content_public_select on app_content;
create policy app_content_public_select on app_content for select using (true);
drop policy if exists app_content_service_role on app_content;
create policy app_content_service_role on app_content for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists app_content_owner_insert on app_content;
create policy app_content_owner_insert on app_content for insert with check (
  exists (select 1 from profiles p where p.id = auth.uid()::text and p.role in ('owner', 'superadmin'))
);
drop policy if exists app_content_owner_update on app_content;
create policy app_content_owner_update on app_content for update
  using (exists (select 1 from profiles p where p.id = auth.uid()::text and p.role in ('owner', 'superadmin')))
  with check (exists (select 1 from profiles p where p.id = auth.uid()::text and p.role in ('owner', 'superadmin')));
drop policy if exists app_content_owner_delete on app_content;
create policy app_content_owner_delete on app_content for delete using (
  exists (select 1 from profiles p where p.id = auth.uid()::text and p.role in ('owner', 'superadmin'))
);

-- ---------- ترقية حسابك لـ owner (شغّله مرة واحدة بعد ما تحط الـ id) ----------
-- احصل على الـ id من: Authentication → Users → انسخ User UID
-- ثم شغّل السطر التالي بعد ما تستبدل YOUR_USER_ID بالـ UUID الحقيقي:
-- update public.profiles set role = 'owner' where id = 'YOUR_USER_ID';
