-- Weekly Narrative Reports: The Premium Value Layer
create table if not exists public.weekly_reports (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    year int not null,
    week_number int not null,
    start_date date not null,
    end_date date not null,
    summary_data jsonb not null default '{}'::jsonb,
    report_result jsonb not null default '{}'::jsonb,
    source text not null default 'gemini',
    latency_ms int,
    created_at timestamptz not null default now(),
    
    unique(user_id, year, week_number)
);

-- RLS Policies
alter table public.weekly_reports enable row level security;

create policy "weekly_reports_select_own" on public.weekly_reports
    for select using (auth.uid() = user_id);

-- Only service role (server) can insert/update reports to ensure data integrity
create policy "weekly_reports_service_role" on public.weekly_reports
    for all using (auth.role() = 'service_role');

-- Indexes for performance
create index if not exists weekly_reports_user_id_idx on public.weekly_reports (user_id);
create index if not exists weekly_reports_lookup_idx on public.weekly_reports (user_id, year, week_number);
