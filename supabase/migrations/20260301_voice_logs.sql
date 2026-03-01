-- Voice Logs: Tracking AI Presence activity
create table if not exists public.voice_presence_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    event_type text not null,
    script_text text not null,
    created_at timestamptz not null default now()
);

-- RLS Policies
alter table public.voice_presence_logs enable row level security;

create policy "voice_logs_select_own" on public.voice_presence_logs
    for select using (auth.uid() = user_id);

-- Only service role can insert
create policy "voice_logs_service_role_all" on public.voice_presence_logs
    for all using (auth.role() = 'service_role');

-- Index for daily check
create index if not exists voice_logs_user_date_idx on public.voice_presence_logs (user_id, created_at desc);
