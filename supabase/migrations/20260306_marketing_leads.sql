-- Marketing leads captured from landing and campaign funnels
create table if not exists public.marketing_leads (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    source text not null default 'landing',
    utm jsonb,
    note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint marketing_leads_email_format_chk check (
        email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    )
);

create index if not exists marketing_leads_source_created_idx
    on public.marketing_leads (source, created_at desc);

create index if not exists marketing_leads_campaign_idx
    on public.marketing_leads ((utm->>'utm_campaign'));

-- Lock table for direct anon/authenticated access.
-- Inserts/updates happen via server-side service role key.
alter table public.marketing_leads enable row level security;

-- Keep updated_at fresh on upserts/updates.
create or replace function public.touch_marketing_leads_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_marketing_leads_touch_updated_at on public.marketing_leads;
create trigger trg_marketing_leads_touch_updated_at
before update on public.marketing_leads
for each row execute function public.touch_marketing_leads_updated_at();
