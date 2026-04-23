-- Create user_biometrics table
create table if not exists public.user_biometrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  heart_rate smallint not null,
  hrv smallint not null,
  timestamp timestamp with time zone default now() not null,
  source text default 'unknown'
);

-- Index for fast retrieval of latest pulse
create index if not exists user_biometrics_user_id_timestamp_idx on public.user_biometrics (user_id, timestamp desc);

-- RLS
alter table public.user_biometrics enable row level security;

drop policy if exists user_biometrics_select_own on public.user_biometrics;
create policy "user_biometrics_select_own" on public.user_biometrics
  for select using (auth.uid() = user_id);

drop policy if exists user_biometrics_insert_own on public.user_biometrics;
create policy "user_biometrics_insert_own" on public.user_biometrics
  for insert with check (auth.uid() = user_id);

drop policy if exists user_biometrics_service_role on public.user_biometrics;
create policy "user_biometrics_service_role" on public.user_biometrics
  for all using (auth.role() = 'service_role');
