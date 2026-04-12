-- Supabase Migration: Create sessions table for SessionOSPanel
-- Date: 2026-04-12

CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT,
    session_type TEXT NOT NULL CHECK (session_type IN ('assessment', 'followup', 'crisis', 'coaching')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'done', 'cancelled')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    notes TEXT DEFAULT '',
    ai_summary TEXT DEFAULT '',
    goals TEXT DEFAULT ''
);

-- Indexes for Admin Dashboard querying
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON public.sessions(created_at DESC);

-- Enable RLS (Secure by default)
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Note: No public policies are created here since administrative panels typically use the Service Role 
-- or have specific authenticated admin policies. If admins access this table using their own user token, 
-- you'll need a policy like: 
-- CREATE POLICY "Admins can access sessions" ON public.sessions FOR ALL USING (auth.uid() IN (SELECT id FROM admins_table));
