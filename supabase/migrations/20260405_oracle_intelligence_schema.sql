-- Migration: Oracle Intelligence Schema Hardening
-- Goal: Optimize marketing_leads for AI-driven soul grading.

-- 1. Add specific index to oracle_grade inside metadata for fast dashboard filtering
CREATE INDEX IF NOT EXISTS idx_marketing_leads_oracle_grade 
  ON public.marketing_leads ((metadata->>'oracle_grade'));

-- 2. Add last_ai_analysis_at to track when the Oracle last scanned this soul
ALTER TABLE public.marketing_leads 
  ADD COLUMN IF NOT EXISTS last_ai_analysis_at TIMESTAMPTZ;

-- 3. Ensure system_settings has a key for Oracle status
INSERT INTO public.system_settings (key, value)
VALUES ('oracle_analysis_active', 'false')
ON CONFLICT (key) DO NOTHING;

-- 4. Create RPC for grade distribution analysis
CREATE OR REPLACE FUNCTION public.get_oracle_grade_distribution()
RETURNS TABLE (grade text, count bigint) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(metadata->>'oracle_grade', 'UNGRADED') as grade,
        COUNT(*) as count
    FROM public.marketing_leads
    GROUP BY metadata->>'oracle_grade'
    ORDER BY count DESC;
END;
$$;
