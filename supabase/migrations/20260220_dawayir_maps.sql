-- جدول تخزين خرائط منصة دواير (Dawayir Maps)
create table if not exists dawayir_maps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  insight_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast user map retrieval
create index if not exists dawayir_maps_user_id_idx on dawayir_maps(user_id);
create index if not exists dawayir_maps_updated_at_idx on dawayir_maps(updated_at desc);

-- Keep updated_at current on edits
drop trigger if exists dawayir_maps_set_updated_at on dawayir_maps;
create trigger dawayir_maps_set_updated_at
  before update on dawayir_maps
  for each row execute function public.set_updated_at();

-- Security: Enable Row Level Security (RLS)
alter table dawayir_maps enable row level security;

-- Policies for dawayir_maps
drop policy if exists "Users can view their own maps" on dawayir_maps;
create policy "Users can view their own maps"
  on dawayir_maps for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own maps" on dawayir_maps;
create policy "Users can insert their own maps"
  on dawayir_maps for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own maps" on dawayir_maps;
create policy "Users can update their own maps"
  on dawayir_maps for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own maps" on dawayir_maps;
create policy "Users can delete their own maps"
  on dawayir_maps for delete
  using (auth.uid() = user_id);
