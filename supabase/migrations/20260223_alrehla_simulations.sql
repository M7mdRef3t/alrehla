-- 🧪 Alrehla Simulation Layer (Digital Twin)
-- ===========================================
-- نظام محاكاة النتائج قبل تنفيذها في الواقع

create table if not exists public.alrehla_simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  dream_id uuid references public.alrehla_dreams (id) on delete cascade,
  
  -- اسم السيناريو (مثل: المسار السريع، التدرج الآمن)
  scenario_name text not null,
  
  -- لقطة من حالة الوعي (Twin Snapshot)
  state_snapshot jsonb not null, -- {nodes_count, energy_level, current_pulse_rating}
  
  -- تنبؤات الذكاء الاصطناعي (Predictions)
  outcome_prediction jsonb not null, -- {success_probability, estimated_days, energy_drain}
  impact_analysis jsonb not null, -- {on_relationships, on_mental_health, on_kafaa}
  
  -- نصيحة المساعد الرقمي (Co-Pilot)
  co_pilot_recommendation text,
  critical_warnings text[] default '{}',
  
  created_at timestamptz not null default now()
);

-- الفهارس للبحث
create index if not exists simulations_user_idx on public.alrehla_simulations (user_id);
create index if not exists simulations_dream_idx on public.alrehla_simulations (dream_id);

-- تفعيل البث المباشر (Realtime)
alter publication supabase_realtime add table public.alrehla_simulations;

-- سياسات الأمان (RLS)
alter table public.alrehla_simulations enable row level security;

create policy "Users can view their own simulations"
  on public.alrehla_simulations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own simulations"
  on public.alrehla_simulations for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own simulations"
  on public.alrehla_simulations for delete
  using (auth.uid() = user_id);
