-- Migration: Admin RLS policies for success_stories (idempotent)
-- Safe to re-run: drops existing policies before recreating them.

-- INSERT
DROP POLICY IF EXISTS "Allow authenticated users to insert stories" ON public.success_stories;
CREATE POLICY "Allow authenticated users to insert stories"
ON public.success_stories FOR INSERT TO authenticated
WITH CHECK (true);

-- UPDATE
DROP POLICY IF EXISTS "Allow authenticated users to update stories" ON public.success_stories;
CREATE POLICY "Allow authenticated users to update stories"
ON public.success_stories FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

-- DELETE
DROP POLICY IF EXISTS "Allow authenticated users to delete stories" ON public.success_stories;
CREATE POLICY "Allow authenticated users to delete stories"
ON public.success_stories FOR DELETE TO authenticated
USING (true);

-- SELECT (all rows including drafts)
DROP POLICY IF EXISTS "Allow authenticated users to read all stories" ON public.success_stories;
CREATE POLICY "Allow authenticated users to read all stories"
ON public.success_stories FOR SELECT TO authenticated
USING (true);
