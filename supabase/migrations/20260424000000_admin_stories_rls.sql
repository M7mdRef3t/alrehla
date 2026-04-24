-- Add RLS policies for admin management of success_stories
-- Uses role-based access: admin / owner / superadmin
-- Fix: auth.uid() returns UUID — cast to text before comparing with profiles.id (TEXT column)

-- Allow admins to INSERT
CREATE POLICY "Allow admins to insert stories"
ON public.success_stories
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text
      AND role IN ('admin', 'owner', 'superadmin')
  )
);

-- Allow admins to UPDATE
CREATE POLICY "Allow admins to update stories"
ON public.success_stories
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text
      AND role IN ('admin', 'owner', 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text
      AND role IN ('admin', 'owner', 'superadmin')
  )
);

-- Allow admins to DELETE
CREATE POLICY "Allow admins to delete stories"
ON public.success_stories
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text
      AND role IN ('admin', 'owner', 'superadmin')
  )
);

-- Allow admins to SELECT all stories (including unpublished drafts)
CREATE POLICY "Allow admins to see all stories"
ON public.success_stories
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text
      AND role IN ('admin', 'owner', 'superadmin')
  )
);
