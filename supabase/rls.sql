-- Dawayir V2 RLS Policies (Secure Launch)

-- System settings (admin only)
alter table system_settings enable row level security;
drop policy if exists system_settings_service_role on system_settings;
create policy system_settings_service_role on system_settings
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Admin AI logs (admin only)
alter table admin_ai_logs enable row level security;
drop policy if exists admin_ai_logs_service_role on admin_ai_logs;
create policy admin_ai_logs_service_role on admin_ai_logs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Admin missions (admin only)
alter table admin_missions enable row level security;
drop policy if exists admin_missions_service_role on admin_missions;
create policy admin_missions_service_role on admin_missions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Admin broadcasts (admin only)
alter table admin_broadcasts enable row level security;
drop policy if exists admin_broadcasts_service_role on admin_broadcasts;
create policy admin_broadcasts_service_role on admin_broadcasts
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Admin reports (admin only)
alter table admin_reports enable row level security;
drop policy if exists admin_reports_service_role on admin_reports;
create policy admin_reports_service_role on admin_reports
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Journey events (public insert, admin read)
alter table journey_events enable row level security;
drop policy if exists journey_events_insert on journey_events;
create policy journey_events_insert on journey_events
  for insert
  with check (true);
drop policy if exists journey_events_service_select on journey_events;
create policy journey_events_service_select on journey_events
  for select
  using (auth.role() = 'service_role');

-- Daily pulse logs (public insert, admin read)
alter table daily_pulse_logs enable row level security;
drop policy if exists daily_pulse_logs_insert on daily_pulse_logs;
create policy daily_pulse_logs_insert on daily_pulse_logs
  for insert
  with check (true);
drop policy if exists daily_pulse_logs_service_select on daily_pulse_logs;
create policy daily_pulse_logs_service_select on daily_pulse_logs
  for select
  using (auth.role() = 'service_role');

-- Journey maps (public upsert, admin read)
alter table journey_maps enable row level security;
drop policy if exists journey_maps_insert on journey_maps;
create policy journey_maps_insert on journey_maps
  for insert
  with check (true);
drop policy if exists journey_maps_update on journey_maps;
create policy journey_maps_update on journey_maps
  for update
  using (true)
  with check (true);
drop policy if exists journey_maps_service_select on journey_maps;
create policy journey_maps_service_select on journey_maps
  for select
  using (auth.role() = 'service_role');

-- Profiles (session-only upsert, admin read)
alter table profiles enable row level security;
drop policy if exists profiles_session_insert on profiles;
create policy profiles_session_insert on profiles
  for insert
  with check (coalesce(role, 'session') = 'session');
drop policy if exists profiles_session_update on profiles;
create policy profiles_session_update on profiles
  for update
  using (role = 'session')
  with check (role = 'session');
drop policy if exists profiles_service_select on profiles;
create policy profiles_service_select on profiles
  for select
  using (auth.role() = 'service_role');

drop policy if exists profiles_user_select on profiles;
create policy profiles_user_select on profiles
  for select
  using (auth.uid()::text = id);

-- IMPORTANT: Do not allow authenticated users to update their own profile row directly.
-- Otherwise they can self-escalate `role` to privileged values.
drop policy if exists profiles_user_update on profiles;

-- User state (service role only)
alter table user_state enable row level security;
drop policy if exists user_state_service_role on user_state;
create policy user_state_service_role on user_state
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
