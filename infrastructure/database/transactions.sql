-- Real transactions and revenue tracking schema
-- This closes the gap where revenue was proxied by marketing leads.

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- User Identification
  user_id uuid references auth.users (id),
  lead_id text, -- link back to marketing lead if available
  email text,
  phone text,
  
  -- Transaction Details
  amount decimal(10, 2) not null,
  currency text not null default 'EGP',
  status text not null default 'pending', -- pending, completed, failed, refunded
  provider text not null, -- vodafone_cash, stripe, fawry
  provider_reference text, -- external transaction ID
  
  -- Product Details
  item_type text not null, -- subscription, session, digital_good
  item_id text,
  
  -- Tracking
  client_event_id text, -- for meta/ga attribution
  utm_source text,
  utm_medium text,
  utm_campaign text,
  
  metadata jsonb not null default '{}'::jsonb
);

-- Indexing for Revenue Dashboard
create index if not exists transactions_status_idx on public.transactions (status);
create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists transactions_created_at_idx on public.transactions (created_at desc);

-- RLS (Security)
alter table public.transactions enable row level security;

-- Drop existing policies to avoid 42710 error on re-run
drop policy if exists "Admins can read all transactions" on public.transactions;
drop policy if exists "Users can read own transactions" on public.transactions;

create policy "Admins can read all transactions"
  on public.transactions
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()::text
      and profiles.role in ('owner', 'superadmin', 'admin')
    )
  );

create policy "Users can read own transactions"
  on public.transactions
  for select
  using (auth.uid() = user_id);
