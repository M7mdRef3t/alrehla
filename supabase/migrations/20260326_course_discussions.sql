-- Create course_comments table for live discussions
CREATE TABLE IF NOT EXISTS public.course_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.course_comments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read comments" 
ON public.course_comments FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can post" 
ON public.course_comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.course_comments FOR DELETE 
USING (auth.uid() = user_id);
