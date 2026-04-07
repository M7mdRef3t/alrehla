-- Hotfix: Grant public SELECT permissions on the pioneer_report_card reporting view
-- Date: 2026-04-05

GRANT SELECT ON public.pioneer_report_card TO anon, authenticated;

-- Ensure the helper refresh function is also accessible if needed by restricted workers
GRANT EXECUTE ON FUNCTION public.refresh_pioneer_report_card_mv() TO authenticated, service_role;

COMMENT ON MATERIALIZED VIEW public.pioneer_report_card IS 'Phoenix Performance Reporting (Materialized). Permissions granted for Sovereign HUD access.';
