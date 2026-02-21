-- Migration: Shadow Viral Protocol
-- Description: Creates the shadow_profiles table to store auto-generated profiles for users' contacts.

create table if not exists public.shadow_profiles (
    id uuid primary key default gen_random_uuid(),
    origin_user_id uuid not null references auth.users(id) on delete cascade,
    entity_label text not null, -- The name or label given by the origin user
    assigned_weight integer not null default 0, -- The impact mass (e.g., 8/10)
    hook_headline text, -- Generated curiosity headline
    trigger_message text, -- Generated psychological trigger message
    contact_method text, -- 'email', 'phone', 'whatsapp'
    contact_value text, -- The actual email or phone number
    status text not null default 'DORMANT', -- DORMANT, TRIGGER_SENT, CONVERTED
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Index for fast lookups when a shadow entity clicks the link
create index if not exists idx_shadow_profiles_status on public.shadow_profiles(status);
create index if not exists idx_shadow_profiles_origin on public.shadow_profiles(origin_user_id);

-- RLS Policies
alter table public.shadow_profiles enable row level security;

-- Only the creator can view their generated shadow profiles (or admin/coaches)
create policy "Users can view shadow profiles they created"
    on public.shadow_profiles for select
    using (auth.uid() = origin_user_id);

-- Only authenticated users can trigger the creation of a shadow profile
create policy "Users can insert shadow profiles"
    on public.shadow_profiles for insert
    with check (auth.uid() = origin_user_id);

-- Allow service role to do everything (for automated dispatching)
create policy "Service role can manage all shadow profiles"
    on public.shadow_profiles for all
    using (true)
    with check (true);
