-- Re-create analytics_events safely
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'analytics_events') THEN
        CREATE TABLE public.analytics_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            event_name TEXT NOT NULL,
            user_id UUID REFERENCES auth.users(id),
            params JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            properties JSONB DEFAULT '{}'::jsonb
        );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics_events(user_id);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;

CREATE POLICY "Admins can view analytics events" ON public.analytics_events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

GRANT SELECT, INSERT ON public.analytics_events TO anon, authenticated, service_role;
