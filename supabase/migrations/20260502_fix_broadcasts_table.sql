-- Fix and stabilize admin_broadcasts table
-- Includes audience tracking and send timestamps

CREATE TABLE IF NOT EXISTS public.admin_broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    audience JSONB DEFAULT '{"type": "all"}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    sent_at TIMESTAMPTZ
);

-- Add audience column if it doesn't exist (in case table exists but is old)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='admin_broadcasts' AND COLUMN_NAME='audience') THEN
        ALTER TABLE public.admin_broadcasts ADD COLUMN audience JSONB DEFAULT '{"type": "all"}'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='admin_broadcasts' AND COLUMN_NAME='sent_at') THEN
        ALTER TABLE public.admin_broadcasts ADD COLUMN sent_at TIMESTAMPTZ;
    END IF;
END $$;

-- RLS
ALTER TABLE public.admin_broadcasts ENABLE ROW LEVEL SECURITY;

-- Admin access (assuming admin role or service role handles it)
DROP POLICY IF EXISTS "Admins can do everything on broadcasts" ON public.admin_broadcasts;
CREATE POLICY "Admins can do everything on broadcasts"
ON public.admin_broadcasts
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()::text
    AND profiles.role IN ('admin', 'superadmin', 'owner', 'developer')
  )
);
