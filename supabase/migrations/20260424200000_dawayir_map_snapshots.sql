-- Dawayir Map Snapshots — التتبع الزمني للخرائط
-- كل مرة الخريطة تتحفظ، بيتعمل snapshot تلقائي عشان المستخدم يقدر يقارن "قبل" و"بعد".

BEGIN;

-- 1. جدول الـ Snapshots
CREATE TABLE IF NOT EXISTS public.dawayir_map_snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    map_id uuid REFERENCES public.dawayir_maps(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nodes_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
    edges_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
    insight_snapshot text,
    stress_level_at_time smallint CHECK (stress_level_at_time BETWEEN 0 AND 100),
    node_count smallint NOT NULL DEFAULT 0,
    snapshot_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Indices
CREATE INDEX IF NOT EXISTS idx_map_snapshots_user ON public.dawayir_map_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_map_snapshots_map ON public.dawayir_map_snapshots(map_id, snapshot_at DESC);

-- 3. RLS
ALTER TABLE public.dawayir_map_snapshots ENABLE ROW LEVEL SECURITY;

-- Users can only read their own snapshots
DROP POLICY IF EXISTS "Users can view their own snapshots" ON public.dawayir_map_snapshots;
CREATE POLICY "Users can view their own snapshots" ON public.dawayir_map_snapshots
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage everything (for triggers/functions)
DROP POLICY IF EXISTS "Service role can manage snapshots" ON public.dawayir_map_snapshots;
CREATE POLICY "Service role can manage snapshots" ON public.dawayir_map_snapshots
    FOR ALL USING (auth.role() = 'service_role');

-- Users can insert their own snapshots (needed for client-side snapshot creation)
DROP POLICY IF EXISTS "Users can insert their own snapshots" ON public.dawayir_map_snapshots;
CREATE POLICY "Users can insert their own snapshots" ON public.dawayir_map_snapshots
    FOR INSERT WITH CHECK (auth.uid() = user_id);

COMMIT;
