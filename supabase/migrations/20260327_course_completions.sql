-- Migration: Course Completion Certificates
-- Date: 2026-03-27

CREATE TABLE IF NOT EXISTS public.course_completions (
    id TEXT PRIMARY KEY,                  -- courseId-userId composite
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    course_id TEXT NOT NULL,
    course_title TEXT NOT NULL,
    course_category TEXT NOT NULL DEFAULT '',
    instructor_name TEXT NOT NULL DEFAULT '',
    total_hours TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Publicly readable (so shared certificate links work without auth)
ALTER TABLE public.course_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view certificates" ON public.course_completions;
CREATE POLICY "Anyone can view certificates"
    ON public.course_completions FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own completions" ON public.course_completions;
CREATE POLICY "Users can insert their own completions"
    ON public.course_completions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS course_completions_user_idx ON public.course_completions(user_id);
CREATE INDEX IF NOT EXISTS course_completions_course_idx ON public.course_completions(course_id);
