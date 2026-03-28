-- ══════════════════════════════════════════════════════════════════
-- Alrehla Platform — user_points schema update (v4 — safe to re-run)
-- بدون بيانات تجريبية — الجدول يملأ تلقائياً من المستخدمين الحقيقيين
-- ══════════════════════════════════════════════════════════════════

-- 1. أضف أعمدة الـ Leaderboard المفقودة
ALTER TABLE public.user_points
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS level        integer NOT NULL DEFAULT 1;

-- 2. سياسة قراءة عامة للـ Leaderboard (أي شخص يشوف الترتيب)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_points'
      AND policyname = 'leaderboard_public_read'
  ) THEN
    CREATE POLICY leaderboard_public_read
      ON public.user_points FOR SELECT USING (true);
  END IF;
END $$;

-- 3. Index سريع للترتيب
CREATE INDEX IF NOT EXISTS idx_user_points_total
  ON public.user_points (total_points DESC);

-- 4. حدّث RPC ليدعم display_name و level
CREATE OR REPLACE FUNCTION public.add_user_points(
  p_user_id      uuid,
  p_amount       integer,
  p_display_name text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_total integer;
BEGIN
  INSERT INTO public.user_points (user_id, total_points, display_name)
  VALUES (p_user_id, p_amount, p_display_name)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_points = public.user_points.total_points + p_amount,
    display_name = COALESCE(p_display_name, public.user_points.display_name);

  SELECT total_points INTO new_total
  FROM public.user_points WHERE user_id = p_user_id;

  UPDATE public.user_points
  SET level = GREATEST(1, FLOOR(new_total / 200) + 1)
  WHERE user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_user_points(uuid, integer, text)
  TO authenticated;
