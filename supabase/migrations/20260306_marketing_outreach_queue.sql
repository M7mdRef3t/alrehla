-- Queue for onboarding outreach after lead capture.
create table if not exists public.marketing_lead_outreach_queue (
    id uuid primary key default gen_random_uuid(),
    lead_email text not null references public.marketing_leads(email) on delete cascade,
    channel text not null check (channel in ('email', 'whatsapp')),
    status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'simulated')),
    scheduled_at timestamptz not null,
    sent_at timestamptz,
    attempts integer not null default 0,
    payload jsonb,
    provider_response jsonb,
    last_error text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (lead_email, channel)
);

create index if not exists marketing_lead_outreach_queue_status_idx
    on public.marketing_lead_outreach_queue (status, scheduled_at asc);

alter table public.marketing_lead_outreach_queue enable row level security;

create or replace function public.touch_marketing_lead_outreach_queue_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_marketing_lead_outreach_queue_touch_updated_at on public.marketing_lead_outreach_queue;
create trigger trg_marketing_lead_outreach_queue_touch_updated_at
before update on public.marketing_lead_outreach_queue
for each row execute function public.touch_marketing_lead_outreach_queue_updated_at();
