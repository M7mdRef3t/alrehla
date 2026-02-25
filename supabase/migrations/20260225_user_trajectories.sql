-- user_trajectories.sql — تخزين مسارات الوعي المخصصة 🛣️
-- ========================================================
-- This table stores the output of the Procedural Mission Generator (The Worker).

CREATE TABLE IF NOT EXISTS public.user_trajectories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'composing', -- 'composing', 'ready', 'active', 'archived'
    data JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Stores the full GeneratedMission object
    cognitive_bandwidth FLOAT NOT NULL DEFAULT 1.0, -- Snapshot of CB at time of generation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookup of active trajectory
CREATE INDEX IF NOT EXISTS idx_active_user_trajectory ON public.user_trajectories (user_id) WHERE status = 'active';

-- Enable Row Level Security
ALTER TABLE public.user_trajectories ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own trajectories" ON public.user_trajectories;
CREATE POLICY "Users can view their own trajectories"
    ON public.user_trajectories FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage trajectories" ON public.user_trajectories;
CREATE POLICY "Service role can manage trajectories"
    ON public.user_trajectories FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS set_updated_at_trajectories ON public.user_trajectories;
CREATE TRIGGER set_updated_at_trajectories
BEFORE UPDATE ON public.user_trajectories
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ⚡ Enable Realtime for this table
-- This allows the UI to listen for 'ready' status changes instantly.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_trajectories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_trajectories;
  END IF;
END
$$;
