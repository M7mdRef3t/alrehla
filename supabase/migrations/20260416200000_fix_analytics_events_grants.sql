-- Enable RLS for analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view analytics events
CREATE POLICY "Admins can view analytics events" ON public.analytics_events
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow anyone to insert analytics events (used by telemetry API/client)
CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

-- Ensure PostgREST can see the table via grants
GRANT SELECT, INSERT ON public.analytics_events TO anon, authenticated, service_role;
