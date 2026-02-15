-- هذا الملف يجهز الجداول المطلوبة للوحة التحكم والتتبع.

create extension if not exists "pgcrypto";
create extension if not exists vector with schema public;

-- إعدادات النظام
create table if not exists system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- محتوى المنصة (Dynamic CMS / In-place Editing)
-- تخزين نصوص الواجهة بحيث يمكن للـ Owner تعديلها بدون Deploy.
create table if not exists app_content (
  key text primary key,
  content text not null,
  page text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_content_page_idx on app_content (page);

-- Keep updated_at current on edits
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_content_set_updated_at on app_content;
create trigger app_content_set_updated_at
before update on app_content
for each row execute function public.set_updated_at();


-- سجل الذكاء الاصطناعي (للمراجعة)
create table if not exists admin_ai_logs (
  id text primary key,
  created_at timestamptz not null default now(),
  prompt text not null,
  response text not null,
  source text not null,
  rating text
);

-- سجل تعديلات خريطة التدفق (Audit Trail)
create table if not exists admin_flow_audit_logs (
  id text primary key,
  created_at timestamptz not null default now(),
  action text not null,
  actor_user_id uuid,
  actor_role text,
  target_node_id text,
  target_node_title text,
  payload jsonb not null default '{}'::jsonb
);

-- سجل تدقيق العمليات الإدارية العامة (Security / Ops audit)
create table if not exists admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  action text not null,
  actor_id uuid,
  actor_role text,
  payload jsonb not null default '{}'::jsonb
);

-- تذاكر الدعم (Owner Support Desk)
create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source text not null default 'manual',
  status text not null default 'open',
  priority text not null default 'normal',
  title text not null,
  message text not null,
  session_id text,
  category text,
  assignee text,
  metadata jsonb not null default '{}'::jsonb
);

drop trigger if exists support_tickets_set_updated_at on support_tickets;
create trigger support_tickets_set_updated_at
before update on support_tickets
for each row execute function public.set_updated_at();

-- مكتبة المهام
create table if not exists admin_missions (
  id text primary key,
  title text not null,
  track text not null,
  difficulty text not null,
  created_at timestamptz not null default now()
);

-- رسائل البث
create table if not exists admin_broadcasts (
  id text primary key,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- تقارير إدارية (يومي / أسبوعي)
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

-- تتبع الأحداث
create table if not exists journey_events (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  mode text not null default 'anonymous',
  type text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- نبض المستخدم اللحظي
create table if not exists daily_pulse_logs (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  energy int not null,
  mood text not null,
  focus text not null,
  auto boolean default false,
  created_at timestamptz not null default now()
);

-- لقطات الخريطة (نظرة الإله)
create table if not exists journey_maps (
  session_id text primary key,
  nodes jsonb not null,
  updated_at timestamptz not null default now()
);

-- تخزين بيانات المستخدم (سحابة بدون تسجيل دخول)
create table if not exists user_state (
  device_token text primary key,
  owner_id uuid,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table user_state
  add column if not exists owner_id uuid;

-- ملفات تعريف بسيطة (جلسات التتبع)
create table if not exists profiles (
  id text primary key,
  full_name text,
  email text,
  role text default 'user',
  created_at timestamptz not null default now(),
  last_seen timestamptz
);

-- Sync auth.users -> profiles (for authenticated users)
create or replace function public.handle_auth_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
for each row
when (
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
create index if not exists admin_flow_audit_logs_created_at_idx on admin_flow_audit_logs (created_at desc);
create index if not exists admin_audit_logs_created_at_idx on admin_audit_logs (created_at desc);
create index if not exists support_tickets_created_at_idx on support_tickets (created_at desc);
create index if not exists support_tickets_status_idx on support_tickets (status);
create index if not exists support_tickets_updated_at_idx on support_tickets (updated_at desc);

create index if not exists consciousness_vectors_embedding_cosine_idx
  on public.consciousness_vectors
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- يضمن بث تغييرات المحتوى عبر Realtime
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'app_content'
  ) then
    alter publication supabase_realtime add table app_content;
  end if;
end
$$;

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
