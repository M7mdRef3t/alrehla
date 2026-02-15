-- Add structured pulse fields for energy context.
alter table if exists public.daily_pulse_logs
  add column if not exists energy_reasons text[] not null default '{}'::text[];

alter table if exists public.daily_pulse_logs
  add column if not exists energy_confidence text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'daily_pulse_logs_energy_confidence_check'
      and conrelid = 'public.daily_pulse_logs'::regclass
  ) then
    alter table public.daily_pulse_logs
      add constraint daily_pulse_logs_energy_confidence_check
      check (energy_confidence in ('low', 'medium', 'high'));
  end if;
end
$$;
