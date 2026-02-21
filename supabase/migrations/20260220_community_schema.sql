-- Community & Support Circles Schema (Q2 2026)

-- 1. Support Circles Table
create table if not exists public.support_circles (
  id uuid primary key default gen_random_uuid(),
  topic text not null check (topic in ('family_boundaries', 'guilt_recovery', 'trauma_healing', 'work_burnout')),
  title text not null,
  description text,
  max_members int default 12,
  created_at timestamptz default now()
);

-- 2. Circle Members (Junction Table)
create table if not exists public.circle_members (
  circle_id uuid references public.support_circles(id) on delete cascade,
  user_id text references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (circle_id, user_id)
);

-- 3. Shared Wisdom Table
create table if not exists public.shared_wisdom (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  story text not null,
  strategy text not null,
  author_id text references public.profiles(id) on delete set null,
  helpful_count int default 0,
  created_at timestamptz default now()
);

-- Security: Enable RLS
alter table public.support_circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.shared_wisdom enable row level security;

-- Policies for Shared Wisdom
create policy "Anyone can view shared wisdom"
  on public.shared_wisdom for select
  using (true);

create policy "Users can insert shared wisdom"
  on public.shared_wisdom for insert
  with check (auth.uid()::text = author_id);

-- Policies for Support Circles
create policy "Anyone can view active circles"
  on public.support_circles for select
  using (true);

-- Policies for Circle Members
create policy "Members can view their circle participations"
  on public.circle_members for select
  using (auth.uid()::text = user_id);

create policy "Users can join circles"
  on public.circle_members for insert
  with check (auth.uid()::text = user_id);

-- Seed Initial Content
insert into public.support_circles (topic, title, description, max_members)
values 
('family_boundaries', 'حدود العائلة بدون ذنب', 'دعم للي بيعانوا من صعوبة رسم حدود مع الأهل الممتدين.', 12),
('guilt_recovery', 'التعافي من عقدة الذنب', 'مساحة آمنة للتخلص من جلد الذات المستمر.', 12),
('work_burnout', 'مسار التعافي من الاحتراق', 'للأشخاص اللي دايرة العمل بلعت كل الدواير التانية.', 12)
on conflict do nothing;
