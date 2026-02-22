-- 🧠 Dynamic Consciousness Graph Migration
-- ===========================================
-- يضيف دعم الروابط (Edges) والعلاقات المتغيرة بين عقد السلوك والمشاعر

-- 1. تحديث جدول العقد (Vectors) لربطها بـ "دواير"
alter table if exists public.consciousness_vectors
  add column if not exists ref_id text, -- ID العقدة في الخريطة أو المعرّف الخارجي
  add column if not exists ref_type text; -- النوع (node, pattern, seeker, asset)

create index if not exists consciousness_vectors_ref_idx on public.consciousness_vectors (ref_id, ref_type);
alter table public.consciousness_vectors drop constraint if exists consciousness_vectors_ref_uniq;
alter table public.consciousness_vectors add constraint consciousness_vectors_ref_uniq unique (user_id, ref_id, ref_type);

-- 2. جدول الروابط (Edges)
create table if not exists public.consciousness_edges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  source_id uuid references public.consciousness_vectors (id) on delete cascade,
  target_id uuid references public.consciousness_vectors (id) on delete cascade,
  relation_type text not null, -- ORBITS, EXHIBITS, TRIGGERS, REMEDIES, REINFORCES
  weight float default 1.0, -- قوة الرابط (Synaptic Weight)
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint consciousness_edges_uniq unique (user_id, source_id, target_id, relation_type)
);

-- الفهارس للبحث السريع في الشبكة
create index if not exists consciousness_edges_source_idx on public.consciousness_edges (source_id);
create index if not exists consciousness_edges_target_idx on public.consciousness_edges (target_id);
create index if not exists consciousness_edges_user_idx on public.consciousness_edges (user_id);
create index if not exists consciousness_edges_relation_idx on public.consciousness_edges (relation_type);

-- 3. تفعيل التحديث التلقائي للوقت
create trigger set_updated_at_consciousness_edges
before update on public.consciousness_edges
for each row execute function public.set_updated_at();

-- 4. بث التغييرات (Realtime)
alter publication supabase_realtime add table public.consciousness_edges;
