-- =============================================================================
-- Dawayir V2 — تشغيل مرة واحدة في Supabase
-- =============================================================================
-- 1. افتح Supabase → مشروعك → SQL Editor
-- 2. انسخ هذا الملف كاملاً والصقه في الاستعلام
-- 3. اضغط Run
-- 4. Realtime لجدول app_content يتفعل تلقائياً من هذا السكربت (publication)
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

create table if not exists admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  action text not null,
  actor_id uuid,
  actor_role text,
  payload jsonb not null default '{}'::jsonb
);

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

create table if not exists marketing_gateways (
  id text primary key,
  name text not null,
  status text default 'open' check (status in ('open', 'locked', 'restricted')),
  energy_level integer default 50 check (energy_level >= 0 and energy_level <= 100),
  last_recalibrated_at timestamptz default now(),
  oracle_note text,
  updated_at timestamptz default now()
);

-- Seed initial gateways
insert into marketing_gateways (id, name, status, energy_level)
values 
    ('meta', 'رحلة ميتا', 'open', 50),
    ('tiktok', 'رحلة تيك توك', 'open', 50),
    ('google', 'رحلة جوجل / الموقع', 'open', 50),
    ('direct', 'الرحلة المباشرة', 'open', 50)
on conflict (id) do nothing;

-- Default Harmony Override
insert into system_settings (key, value)
values ('global_harmony_override', '0.8'::jsonb)
on conflict (key) do nothing;

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
  created_at timestamptz not null default now(),
  source text,
  hidden boolean not null default false,
  tags text[],
  manual_notes text
);

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
  energy_reasons text[] not null default '{}'::text[],
  energy_confidence text check (energy_confidence in ('low', 'medium', 'high')),
  auto boolean default false,
  created_at timestamptz not null default now()
);

-- HArdened Tables for v2
create table if not exists journey_maps (
  session_id text primary key,
  user_id uuid references auth.users (id) on delete cascade,
  nodes jsonb not null default '[]'::jsonb,
  is_public boolean default false,
  updated_at timestamptz not null default now(),
  last_sync_at timestamptz default now()
);

create table if not exists routing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id),
  session_id text,
  anonymous_id text,
  event_type text not null,
  payload jsonb,
  occurred_at timestamptz not null default now(),
  client_event_id text,
  updated_at timestamptz default now()
);

-- Legacy/Real-time pulse source for Sovereign Dashboard
create table if not exists journey_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id),
  session_id text,
  type text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists dawayir_ai_decisions (
  id text primary key,
  type text not null,
  timestamp bigint not null,
  reasoning text not null,
  payload jsonb default '{}'::jsonb,
  outcome text,
  approved_by text,
  executed_at bigint,
  created_at timestamptz not null default now()
);

create table if not exists marketing_leads (
  id uuid primary key default gen_random_uuid(),
  email text,
  phone_normalized text,
  phone_raw text,
  name text,
  source text,
  source_type text,
  utm jsonb default '{}'::jsonb,
  note text,
  status text default 'new',
  intent text,
  last_intent_at timestamptz,
  anonymous_id text,
  user_id uuid references auth.users (id),
  merge_conflict boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_linked_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  email_status text default 'none'
);

create table if not exists user_state (
  device_token text primary key,
  owner_id uuid,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

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
create index if not exists admin_flow_audit_logs_created_at_idx on admin_flow_audit_logs (created_at desc);
create index if not exists admin_audit_logs_created_at_idx on admin_audit_logs (created_at desc);
create index if not exists support_tickets_created_at_idx on support_tickets (created_at desc);
create index if not exists support_tickets_status_idx on support_tickets (status);
create index if not exists support_tickets_updated_at_idx on support_tickets (updated_at desc);

-- ---------- Email Tracking & Outreach ----------
create table if not exists email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  html text not null,
  preview_text text,
  category text default 'marketing',
  variables jsonb default '[]'::jsonb,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_sends (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  from_email text not null,
  subject text not null,
  status text not null default 'queued',
  campaign_tag text,
  template_id uuid references email_templates(id),
  resend_id text,
  html_snapshot text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_events (
  id uuid primary key default gen_random_uuid(),
  email_send_id uuid not null references email_sends(id) on delete cascade,
  event_type text not null, -- 'delivered', 'opened', 'clicked', 'bounced', 'complained'
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists email_templates_name_idx on email_templates (name);
create index if not exists email_sends_to_email_idx on email_sends (to_email);
create index if not exists email_sends_status_idx on email_sends (status);
create index if not exists email_sends_created_at_idx on email_sends (created_at desc);
create index if not exists email_events_send_id_idx on email_events (email_send_id);
create index if not exists email_events_type_idx on email_events (event_type);

-- ---------- Identity Linking Bridge ----------
alter table public.marketing_leads
  add column if not exists user_id uuid references auth.users(id),
  add column if not exists last_linked_at timestamptz,
  add column if not exists anonymous_id text;

create index if not exists marketing_leads_anonymous_id_idx 
  on public.marketing_leads (anonymous_id) 
  where anonymous_id is not null;

create or replace function public.link_identity_v2(
    p_anonymous_id text,
    p_user_id uuid
)
returns table (
    updated_count integer,
    attribution_linked boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_updated_rows integer := 0;
    v_linked boolean := false;
begin
    if p_anonymous_id is null or p_user_id is null then
        return query select 0, false;
        return;
    end if;

    -- Update historical routing events
    update public.routing_events
    set user_id = p_user_id,
        updated_at = now()
    where anonymous_id = p_anonymous_id
      and user_id is null;
    
    get diagnostics v_updated_rows = row_count;

    -- Link in marketing_leads if found
    update public.marketing_leads
    set user_id = p_user_id,
        last_linked_at = now()
    where anonymous_id = p_anonymous_id
      and (user_id is null or user_id = p_user_id);

    v_linked := (found);

    return query select v_updated_rows, v_linked;
end;
$$;

create or replace function public.link_anonymous_to_user(
    p_anonymous_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_res record;
begin
    if auth.uid() is null then
        raise exception 'Authentication required for identity linking';
    end if;

    select * into v_res from public.link_identity_v2(p_anonymous_id, auth.uid());

    return jsonb_build_object(
        'success', true,
        'events_linked', v_res.updated_count,
        'lead_linked', v_res.attribution_linked,
        'linked_at', now()
    );
end;
$$;

-- ---------- Atomic Lead Upsert v2 ----------
create or replace function public.upsert_marketing_lead_v2(
    p_email text,
    p_phone_normalized text,
    p_phone_raw text,
    p_name text,
    p_source text,
    p_source_type text,
    p_utm jsonb,
    p_note text,
    p_status text,
    p_intent text,
    p_anonymous_id text default null
)
returns table (
    lead_id uuid,
    is_new boolean,
    conflict boolean
)
language plpgsql
security definer 
set search_path = public
as $$
declare
    v_existing_id uuid;
    v_existing_email text;
    v_existing_phone text;
    v_conflict boolean := false;
    v_is_new boolean := false;
    v_final_id uuid;
begin
    IF p_phone_normalized IS NOT NULL THEN
        SELECT id, email INTO v_existing_id, v_existing_email
        FROM public.marketing_leads
        WHERE phone_normalized = p_phone_normalized
        FOR UPDATE;
        
        IF v_existing_id IS NOT NULL AND p_email IS NOT NULL AND v_existing_email IS NOT NULL AND v_existing_email != p_email THEN
            v_conflict := TRUE;
        END IF;
    END IF;

    IF v_existing_id IS NULL AND p_email IS NOT NULL THEN
        SELECT id, phone_normalized INTO v_existing_id, v_existing_phone
        FROM public.marketing_leads
        WHERE email = p_email
        FOR UPDATE;

        IF v_existing_id IS NOT NULL AND p_phone_normalized IS NOT NULL AND v_existing_phone IS NOT NULL AND v_existing_phone != p_phone_normalized THEN
            v_conflict := TRUE;
        END IF;
    END IF;

    IF v_existing_id IS NOT NULL THEN
        UPDATE public.marketing_leads
        SET 
            email = COALESCE(p_email, email),
            phone_raw = COALESCE(p_phone_raw, phone_raw),
            name = COALESCE(p_name, name),
            source = COALESCE(p_source, source), 
            source_type = COALESCE(p_source_type, source_type),
            utm = marketing_leads.utm || p_utm,
            note = marketing_leads.note || E'\n' || COALESCE(p_note, ''),
            status = COALESCE(p_status, status),
            intent = COALESCE(p_intent, intent),
            anonymous_id = COALESCE(p_anonymous_id, anonymous_id),
            last_intent_at = CASE WHEN p_intent IS NOT NULL THEN now() ELSE last_intent_at END,
            merge_conflict = v_conflict OR merge_conflict,
            updated_at = now()
        WHERE id = v_existing_id
        RETURNING id INTO v_final_id;
    ELSE
        INSERT INTO public.marketing_leads (
            email, phone_normalized, phone_raw, name, source, source_type, utm, note, status, intent, last_intent_at, merge_conflict, anonymous_id
        ) VALUES (
            p_email, p_phone_normalized, p_phone_raw, p_name, p_source, p_source_type, p_utm, p_note, p_status, p_intent, 
            CASE WHEN p_intent IS NOT NULL THEN now() ELSE NULL END, v_conflict, p_anonymous_id
        )
        RETURNING id INTO v_final_id;
        v_is_new := TRUE;
    END IF;

    RETURN QUERY SELECT v_final_id, v_is_new, v_conflict;
end;
$$;

drop trigger if exists email_templates_set_updated_at on email_templates;
create trigger email_templates_set_updated_at
before update on email_templates
for each row execute function public.set_updated_at();

drop trigger if exists email_sends_set_updated_at on email_sends;
create trigger email_sends_set_updated_at
before update on email_sends
for each row execute function public.set_updated_at();

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

-- ---------- Security Hardening Helpers ----------
create or replace function public.is_admin_check(check_user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = check_user_id::text
      and role in ('admin', 'owner', 'superadmin', 'developer')
  );
end;
$$ language plpgsql security definer;

-- ---------- RLS ----------
alter table system_settings enable row level security;
drop policy if exists system_settings_service_role on system_settings;
create policy system_settings_service_role on system_settings for all using (auth.role() = 'service_role');

alter table app_content enable row level security;
drop policy if exists app_content_public_select on app_content;
create policy app_content_public_select on app_content for select using (true);
drop policy if exists app_content_owner_all on app_content;
create policy app_content_owner_all on app_content for all using (public.is_admin_check(auth.uid()));

alter table profiles enable row level security;
drop policy if exists profiles_self_select on profiles;
create policy profiles_self_select on profiles for select using (auth.uid()::text = id);
drop policy if exists profiles_admin_select on profiles;
create policy profiles_admin_select on profiles for select using (public.is_admin_check(auth.uid()));

alter table routing_events enable row level security;
drop policy if exists routing_events_insert on routing_events;
create policy routing_events_insert on routing_events for insert with check (true);
drop policy if exists routing_events_admin_select on routing_events;
create policy routing_events_admin_select on routing_events for select using (public.is_admin_check(auth.uid()));

alter table marketing_leads enable row level security;
drop policy if exists marketing_leads_admin_all on marketing_leads;
create policy marketing_leads_admin_all on marketing_leads for all using (public.is_admin_check(auth.uid()));

alter table journey_maps enable row level security;
drop policy if exists journey_maps_owner_select on journey_maps;
create policy journey_maps_owner_select on journey_maps for select using (auth.uid() = user_id or is_public = true);
drop policy if exists journey_maps_owner_upsert on journey_maps;
create policy journey_maps_owner_upsert on journey_maps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists journey_maps_admin_select on journey_maps;
create policy journey_maps_admin_select on journey_maps for select using (public.is_admin_check(auth.uid()));

-- ---------- Email RLS ----------
alter table email_templates enable row level security;
drop policy if exists email_templates_admin_all on email_templates;
create policy email_templates_admin_all on email_templates for all using (public.is_admin_check(auth.uid()));

alter table email_sends enable row level security;
drop policy if exists email_sends_admin_all on email_sends;
create policy email_sends_admin_all on email_sends for all using (public.is_admin_check(auth.uid()));

alter table email_events enable row level security;
drop policy if exists email_events_admin_all on email_events;
create policy email_events_admin_all on email_events for all using (public.is_admin_check(auth.uid()));
drop policy if exists email_events_public_insert on email_events;
create policy email_events_public_insert on email_events for insert with check (true);

-- ---------- Triggers for Updated At & Identity ----------
drop trigger if exists email_templates_set_updated_at on email_templates;
create trigger email_templates_set_updated_at
before update on email_templates
for each row execute function public.set_updated_at();

drop trigger if exists email_sends_set_updated_at on email_sends;
create trigger email_sends_set_updated_at
before update on email_sends
for each row execute function public.set_updated_at();

create or replace function public.trg_link_lead_identity_logic()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_target_user_id uuid;
begin
    select id::uuid into v_target_user_id
    from public.profiles
    where email = NEW.email
    limit 1;

    if v_target_user_id is not null and NEW.anonymous_id is not null then
        perform public.link_identity_v2(NEW.anonymous_id, v_target_user_id);
        NEW.user_id := v_target_user_id;
    end if;

    return NEW;
end;
$$;

drop trigger if exists trg_link_lead_identity on public.marketing_leads;
create trigger trg_link_lead_identity
before insert or update of anonymous_id on public.marketing_leads
for each row
execute function public.trg_link_lead_identity_logic();

-- ---------- ترقية حسابك لـ owner ----------
-- update public.profiles set role = 'owner' where id = 'YOUR_USER_ID';
