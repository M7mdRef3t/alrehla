-- Alrehla Dreams Data Layer (Life OS)
-- ===========================================
-- ينظم الأحلام، الأهداف الاستراتيجية، والعقد النفسية

do $$ 
begin
    if not exists (select 1 from pg_type where typname = 'dream_status') then
        create type dream_status as enum ('DREAMING', 'IN_FLIGHT', 'REALIZED', 'ARCHIVED');
    end if;
end $$;

create table if not exists public.alrehla_dreams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  title text not null,
  description text,
  vision_url text, -- رابط للوحة الرؤية المولدة بالذكاء الاصطناعي
  status dream_status default 'DREAMING',
  
  -- طبقة القياس (KPIs)
  kpis jsonb default '[]'::jsonb, -- Array of {label, target, current, unit}
  
  -- طبقة المقاومة / العقد (Knots)
  knots jsonb default '[]'::jsonb, -- Array of {id, label, severity, type: 'psychological'|'physical'}
  
  -- طبقة الطاقة (Fuel)
  energy_required int check (energy_required between 1 and 10),
  estimated_completion_date date,
  
  -- ذكاء النظام (System Intelligence)
  alignment_score float default 0.0, -- مدى التوافق مع قيم المستخدم العليا (0-1)
  is_sovereign boolean default true, -- هل المستخدم هو صاحب القرار النهائي أم المساعد الرقمي؟
  
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- الفهارس للبحث السريع وتكامل البيانات
create index if not exists dreams_user_idx on public.alrehla_dreams (user_id);
create index if not exists dreams_status_idx on public.alrehla_dreams (status);

-- تفعيل التحديث التلقائي للوقت
drop trigger if exists set_updated_at_alrehla_dreams on public.alrehla_dreams;
create trigger set_updated_at_alrehla_dreams
before update on public.alrehla_dreams
for each row execute function public.set_updated_at();

-- تفعيل البث المباشر (Realtime)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'alrehla_dreams'
  ) then
    alter publication supabase_realtime add table public.alrehla_dreams;
  end if;
end $$;

-- سياسات الأمان (Row Level Security)
alter table public.alrehla_dreams enable row level security;

drop policy if exists "Users can view their own dreams" on public.alrehla_dreams;
create policy "Users can view their own dreams"
  on public.alrehla_dreams for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own dreams" on public.alrehla_dreams;
create policy "Users can insert their own dreams"
  on public.alrehla_dreams for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own dreams" on public.alrehla_dreams;
create policy "Users can update their own dreams"
  on public.alrehla_dreams for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own dreams" on public.alrehla_dreams;
create policy "Users can delete their own dreams"
  on public.alrehla_dreams for delete
  using (auth.uid() = user_id);
