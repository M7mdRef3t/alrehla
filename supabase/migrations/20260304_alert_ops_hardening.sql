BEGIN;

-- 1) Incident history for auditability (who/when/why)
CREATE TABLE IF NOT EXISTS public.alert_incident_history (
  id bigserial PRIMARY KEY,
  incident_id uuid NOT NULL REFERENCES public.alert_incidents(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL CHECK (to_status IN ('open', 'ack', 'resolved')),
  changed_by text,
  changed_by_role text,
  reason text,
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Performance indexes for common reads
CREATE INDEX IF NOT EXISTS idx_alert_incidents_status_rule_opened
  ON public.alert_incidents (status, rule_key, opened_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_incidents_opened_at
  ON public.alert_incidents (opened_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_sweep_runs_ran_at
  ON public.alert_sweep_runs (ran_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_incident_history_incident_changed_at
  ON public.alert_incident_history (incident_id, changed_at DESC);

-- 3) Retention helper for sweep logs
CREATE OR REPLACE FUNCTION public.prune_alert_sweep_runs(retention_days integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  DELETE FROM public.alert_sweep_runs
  WHERE ran_at < now() - make_interval(days => GREATEST(retention_days, 1));

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- 4) RLS + admin policy
ALTER TABLE public.alert_incident_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_alert_incident_history"
ON public.alert_incident_history
FOR ALL
TO authenticated
USING (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()::text
      and p.role IN ('owner', 'superadmin')
  )
);

COMMIT;
