-- Create table for AI autonomous decisions log
CREATE TABLE IF NOT EXISTS public.dawayir_ai_decisions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  reasoning TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  outcome TEXT,
  approved_by TEXT,
  executed_at BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add index for fast retrieval by timestamp
CREATE INDEX IF NOT EXISTS dawayir_ai_decisions_timestamp_idx ON public.dawayir_ai_decisions (timestamp DESC);

-- Enable RLS
ALTER TABLE public.dawayir_ai_decisions ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users (admins)
CREATE POLICY "Admins can view AI decisions" ON public.dawayir_ai_decisions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow insert access for authenticated users (ai / admins)
CREATE POLICY "System can insert AI decisions" ON public.dawayir_ai_decisions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow update access for authenticated users
CREATE POLICY "System can update AI decisions" ON public.dawayir_ai_decisions
  FOR UPDATE USING (auth.role() = 'authenticated');
