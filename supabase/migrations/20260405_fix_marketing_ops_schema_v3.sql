-- Migration: Fix Marketing Ops Schema Mismatch
-- Goal: Add missing metadata column to marketing_leads and create system_settings table.

-- 1. Correct marketing_leads to include metadata (jsonb)
alter table public.marketing_leads
  add column if not exists metadata jsonb;

-- 2. Create system_settings for global flags (Control Center Flags)
create table if not exists public.system_settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- 3. RLS for system_settings
alter table public.system_settings enable row level security;

-- 4. Policies (Read: Anon/Auth | Write: Service Role only for locking gateways)
create policy "Allow public read for settings"
  on public.system_settings for select
  using (true);

-- Insert default value for gateways_locked_all if not present
insert into public.system_settings (key, value)
values ('gateways_locked_all', 'false')
on conflict (key) do nothing;
