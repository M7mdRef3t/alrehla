-- Create the feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    content TEXT NOT NULL,
    rating TEXT CHECK (rating IN ('up', 'down') OR rating IS NULL),
    source TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback
CREATE POLICY "Allow anyone to insert feedback" ON public.feedback
    FOR INSERT 
    WITH CHECK (true);

-- Allow admins to read feedback
CREATE POLICY "Allow admins to read feedback" ON public.feedback
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid()::text 
            AND profiles.role IN ('super_admin', 'owner')
        )
    );

-- Allow service role full access
CREATE POLICY "Service role full access on feedback" ON public.feedback
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
