-- 20260418_add_performance_logs.sql
-- بنية تحتية لـ The Auto-Architect لجعل السيستم يراقب نفسه ويحسنها.

-- جدول سجلات الأداء (Signals)
create table if not exists performance_logs (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  status text not null,
  avg_lag_ms int not null,
  p95_lag_ms int not null,
  long_tasks_1m int not null,
  freezes_1m int not null,
  last_freeze_at timestamptz,
  url text,
  created_at timestamptz not null default now()
);

-- جدول مقترحات التحسين (Optimizations)
create table if not exists architect_optimizations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null, -- 'index', 'schema_change', 'code_refactor'
  target text not null, -- اسم الجدول أو مسار الملف
  rationale text not null, -- المنطق وراء التعديل
  proposed_fix text not null, -- الـ SQL أو الكود المقترح
  impact_estimate text, -- التأثير المتوقع (مثلاً: "تقليل وقت الاستعلام بـ 50%")
  status text not null default 'proposed', -- 'proposed', 'applied', 'rejected'
  applied_at timestamptz
);

-- فهارس للسرعة
create index if not exists performance_logs_created_at_idx on performance_logs (created_at desc);
create index if not exists performance_logs_status_idx on performance_logs (status);
create index if not exists architect_optimizations_status_idx on architect_optimizations (status);

-- وظيفة لمساعدة الوكيل في قراءة بنية الجداول بسهولة
create or replace function public.get_schema_details()
returns jsonb
language plpgsql
security definer
as $$
declare
    result jsonb;
begin
    select jsonb_agg(jsonb_build_object(
        'table_name', table_name,
        'columns', (
            select jsonb_agg(jsonb_build_object(
                'column_name', column_name,
                'data_type', data_type
            ))
            from information_schema.columns c
            where c.table_name = t.table_name
              and c.table_schema = 'public'
        )
    ))
    into result
    from (
        select distinct table_name
        from information_schema.tables
        where table_schema = 'public'
          and table_type = 'BASE TABLE'
    ) t;
    
    return coalesce(result, '[]'::jsonb);
end;
$$;

-- تفعيل البث اللحظي (Realtime) لنتائج الأداء في لوحة التحكم
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'performance_logs'
  ) then
    alter publication supabase_realtime add table performance_logs;
  end if;
end
$$;
