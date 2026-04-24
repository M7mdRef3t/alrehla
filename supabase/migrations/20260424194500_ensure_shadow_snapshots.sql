-- Migration: Ensure Shadow Memory Snapshots Table
-- Force creation of shadow_snapshots if missing and ensure RLS
-- Timestamp: 20260424194500

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'shadow_snapshots') THEN
        CREATE TABLE public.shadow_snapshots (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            entropy_score integer NOT NULL,
            state text NOT NULL, -- 'CHAOS', 'ORDER', 'FLOW'
            primary_factor text,
            metadata jsonb DEFAULT '{}'::jsonb,
            timestamp timestamptz NOT NULL DEFAULT now()
        );

        -- Indexing for time-series analysis
        CREATE INDEX idx_shadow_snapshots_user_time ON public.shadow_snapshots(user_id, timestamp DESC);

        -- RLS
        ALTER TABLE public.shadow_snapshots ENABLE ROW LEVEL SECURITY;

        -- Policies
        CREATE POLICY "Users can view their own snapshots"
            ON public.shadow_snapshots FOR SELECT
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own snapshots"
            ON public.shadow_snapshots FOR INSERT
            WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Coaches can view client snapshots"
            ON public.shadow_snapshots FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.coach_connections
                    WHERE coach_id = (auth.uid())::text
                    AND client_id = public.shadow_snapshots.user_id::text
                    AND status = 'active'
                )
            );
    END IF;
END $$;
