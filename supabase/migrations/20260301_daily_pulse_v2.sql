-- Daily Pulse V2: Strengthening the retention loop
-- 1. Add missing core columns
alter table if exists public.daily_pulse_logs
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists day date default current_date;

-- 2. Add rich context columns
alter table if exists public.daily_pulse_logs
  add column if not exists stress_tag text,
  add column if not exists note text;

-- 3. Transition mood to smallint if needed (handling existing text data carefully)
-- We'll add a temporary column, migrate, then swap.
do $$
begin
  if (select data_type from information_schema.columns where table_name = 'daily_pulse_logs' and column_name = 'mood') = 'text' then
    alter table public.daily_pulse_logs rename column mood to mood_old;
    alter table public.daily_pulse_logs add column mood smallint;
    -- Try to cast old text values to smallint where they are numbers, otherwise default to 3
    update public.daily_pulse_logs 
    set mood = case 
      when mood_old ~ '^[0-9]+$' then mood_old::smallint 
      else 3 
    end;
    alter table public.daily_pulse_logs alter column mood set not null;
    alter table public.daily_pulse_logs drop column mood_old;
  end if;
end
$$;

-- 4. Ensure energy is numeric and in range
alter table if exists public.daily_pulse_logs 
  alter column energy type smallint using energy::smallint;

-- 5. Set missing user_id for existing rows based on session_id if possible (linked to profiles)
update public.daily_pulse_logs l
set user_id = p.id::uuid
from public.profiles p
where l.session_id = p.id
and l.user_id is null
and p.id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 6. Add unique constraint: One pulse per user per day
create unique index if not exists daily_pulse_unique_idx on public.daily_pulse_logs (user_id, day);

-- 7. Hardened RLS for daily_pulse_logs
alter table public.daily_pulse_logs enable row level security;

drop policy if exists daily_pulse_logs_insert on public.daily_pulse_logs;
create policy "daily_pulse_insert_own" on public.daily_pulse_logs
  for insert with check (auth.uid() = user_id);

drop policy if exists daily_pulse_logs_select_own on public.daily_pulse_logs;
create policy "daily_pulse_select_own" on public.daily_pulse_logs
  for select using (auth.uid() = user_id);

drop policy if exists daily_pulse_logs_update_own on public.daily_pulse_logs;
create policy "daily_pulse_update_own" on public.daily_pulse_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists daily_pulse_logs_service_role on public.daily_pulse_logs;
create policy "daily_pulse_service_role" on public.daily_pulse_logs
  for all using (auth.role() = 'service_role');
