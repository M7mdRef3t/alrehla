-- تحديثات بنية منصة B2B (Coach Platform)

-- 1. تحديث جدول profiles لإضافة نوع الحساب والحد الأقصى للعملاء
alter table public.profiles
  add column if not exists role text default 'user',
  add column if not exists max_clients int default 0;

-- 2. جدول اتصالات المعالجين (Coach Connections)
create table if not exists public.coach_connections (
  id uuid primary key default gen_random_uuid(),
  coach_id text references public.profiles(id) on delete cascade,
  client_id text references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'active', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(coach_id, client_id)
);

create index if not exists coach_connections_coach_id_idx on public.coach_connections(coach_id);
create index if not exists coach_connections_client_id_idx on public.coach_connections(client_id);
create index if not exists coach_connections_status_idx on public.coach_connections(status);

-- Keep updated_at current on edits
drop trigger if exists coach_connections_set_updated_at on public.coach_connections;
create trigger coach_connections_set_updated_at
  before update on public.coach_connections
  for each row execute function public.set_updated_at();

-- Security: Enable Row Level Security (RLS)
alter table public.coach_connections enable row level security;

-- Policies for coach_connections
drop policy if exists "Coaches can view their connections" on public.coach_connections;
create policy "Coaches can view their connections"
  on public.coach_connections for select
  using ((auth.uid())::text = coach_id);

drop policy if exists "Clients can view their connections" on public.coach_connections;
create policy "Clients can view their connections"
  on public.coach_connections for select
  using ((auth.uid())::text = client_id);

drop policy if exists "Coaches can insert invitations" on public.coach_connections;
create policy "Coaches can insert invitations"
  on public.coach_connections for insert
  with check ((auth.uid())::text = coach_id);

drop policy if exists "Clients can update connection status" on public.coach_connections;
create policy "Clients can update connection status"
  on public.coach_connections for update
  using ((auth.uid())::text = client_id)
  with check ((auth.uid())::text = client_id);

drop policy if exists "Coaches or Clients can delete connections" on public.coach_connections;
create policy "Coaches or Clients can delete connections"
  on public.coach_connections for delete
  using ((auth.uid())::text = coach_id or (auth.uid())::text = client_id);


-- 3. تحديث جدول dawayir_maps لدعم مشاركة المعالج
alter table public.dawayir_maps
  add column if not exists shared_with_coach boolean not null default false;

-- Policy: Coaches can view maps shared intentionally by connected clients
drop policy if exists "Coaches can view shared client maps" on public.dawayir_maps;
create policy "Coaches can view shared client maps"
  on public.dawayir_maps for select
  using (
    shared_with_coach = true 
    and exists (
      select 1 from public.coach_connections
      where coach_connections.client_id = dawayir_maps.user_id::text
      and coach_connections.coach_id = (auth.uid())::text
      and coach_connections.status = 'active'
    )
  );
