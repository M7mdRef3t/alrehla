-- 20260418_add_ui_mutations.sql
-- الجدول الأساسي لتتبع "الطفرات الجينية" للكود

create table if not exists ui_mutations (
  id uuid primary key default gen_random_uuid(),
  component_id text not null, -- e.g. 'HeroSection'
  variant_name text not null, -- e.g. 'v1_minimalist'
  variant_path text not null, -- مسار الملف في src/evolution/
  hypothesis text, -- لماذا تم إنشاء هذه النسخة؟
  is_active boolean default false,
  resonance_score_delta float default 0, -- التغير في الرنين
  friction_events_count int default 0, -- عدد الاحتكاكات المسجلة مع هذه النسخة
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  deactivated_at timestamptz
);

-- فهرس للبحث السريع عن النسخة النشطة
create index if not exists ui_mutations_active_idx on ui_mutations (component_id) where is_active = true;

-- تفعيل البث اللحظي للتبديل السريع بين النسخ
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'ui_mutations'
  ) then
    alter publication supabase_realtime add table ui_mutations;
  end if;
end
$$;
