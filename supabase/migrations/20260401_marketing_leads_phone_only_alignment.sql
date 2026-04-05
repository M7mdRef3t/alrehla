-- Align marketing lead schema with current application behavior:
-- 1) phone-only lead capture must be valid
-- 2) email uniqueness should apply only when an email exists
-- 3) lead metadata columns used by the API must exist

alter table public.marketing_leads
  alter column email drop not null;

alter table public.marketing_leads
  add column if not exists phone_normalized text,
  add column if not exists phone_raw text,
  add column if not exists merge_conflict boolean not null default false,
  add column if not exists intent text,
  add column if not exists last_intent_at timestamptz;

update public.marketing_leads
set phone_normalized = coalesce(phone_normalized, phone)
where phone is not null
  and phone_normalized is null;

alter table public.marketing_leads
  drop constraint if exists marketing_leads_email_key;

drop index if exists public.marketing_leads_email_key;

create unique index if not exists marketing_leads_email_unique_not_null_idx
  on public.marketing_leads (email)
  where email is not null;

create index if not exists marketing_leads_phone_normalized_idx
  on public.marketing_leads (phone_normalized)
  where phone_normalized is not null;

alter table public.marketing_leads
  drop constraint if exists marketing_leads_source_type_chk;

alter table public.marketing_leads
  add constraint marketing_leads_source_type_chk
  check (source_type in ('website', 'meta_instant_form', 'manual_import', 'whatsapp'));

alter table public.marketing_leads
  drop constraint if exists marketing_leads_status_chk;

alter table public.marketing_leads
  add constraint marketing_leads_status_chk
  check (
    status in (
      'new',
      'engaged',
      'payment_requested',
      'hot_activation_interrupted',
      'proof_received',
      'activated',
      'lost',
      'contacted',
      'qualified',
      'unresponsive',
      'started',
      'converted'
    )
  );
