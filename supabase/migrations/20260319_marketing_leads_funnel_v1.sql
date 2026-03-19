alter table public.marketing_leads
    add column if not exists phone text,
    add column if not exists name text,
    add column if not exists source_type text not null default 'website',
    add column if not exists campaign text,
    add column if not exists adset text,
    add column if not exists ad text,
    add column if not exists placement text,
    add column if not exists status text not null default 'new',
    add column if not exists last_contacted_at timestamptz,
    add column if not exists qualified_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'marketing_leads_source_type_chk'
  ) then
    alter table public.marketing_leads
      add constraint marketing_leads_source_type_chk
      check (source_type in ('website', 'meta_instant_form', 'manual_import'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'marketing_leads_status_chk'
  ) then
    alter table public.marketing_leads
      add constraint marketing_leads_status_chk
      check (status in ('new', 'contacted', 'qualified', 'unresponsive', 'started', 'converted'));
  end if;
end
$$;

create index if not exists marketing_leads_source_type_created_idx
    on public.marketing_leads (source_type, created_at desc);

create index if not exists marketing_leads_status_created_idx
    on public.marketing_leads (status, created_at desc);

create index if not exists marketing_leads_campaign_created_idx
    on public.marketing_leads (campaign, created_at desc);

alter table public.marketing_lead_outreach_queue
    add column if not exists step integer not null default 1;

alter table public.marketing_lead_outreach_queue
    drop constraint if exists marketing_lead_outreach_queue_lead_email_channel_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'marketing_lead_outreach_queue_lead_email_channel_step_key'
  ) then
    alter table public.marketing_lead_outreach_queue
      add constraint marketing_lead_outreach_queue_lead_email_channel_step_key
      unique (lead_email, channel, step);
  end if;
end
$$;

create index if not exists marketing_lead_outreach_queue_lead_status_idx
    on public.marketing_lead_outreach_queue (lead_email, status, scheduled_at asc);
