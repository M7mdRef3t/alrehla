-- Dawayir V2 Supabase Schema
-- هذا الملف يجهز الجداول المطلوبة للوحة التحكم والتتبع.

create extension if not exists "pgcrypto";

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
