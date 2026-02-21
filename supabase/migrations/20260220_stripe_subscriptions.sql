-- تحديثات بنية جداول الاشتراكات (Stripe Subscriptions)

alter table public.profiles
  add column if not exists stripe_customer_id text unique,
  add column if not exists subscription_status text default 'none', -- 'none', 'active', 'past_due', 'canceled'
  add column if not exists subscription_price_id text,
  add column if not exists current_period_end timestamptz;

-- Policy to allow users to read their own subscription status
drop policy if exists "Users can view their own subscription status" on public.profiles;
create policy "Users can view their own subscription status"
  on public.profiles for select
  using ((auth.uid())::text = id);

-- Note: Updates to these columns should only happen via the Service Role (from the Stripe Webhook)
-- We do not add an UPDATE policy for regular users for these new fields.
