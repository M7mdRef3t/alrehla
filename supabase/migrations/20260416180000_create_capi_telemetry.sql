
CREATE TABLE IF NOT EXISTS capi_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_name TEXT NOT NULL,
  event_id TEXT NOT NULL,
  status TEXT NOT NULL,
  response_code INTEGER,
  payload JSONB NOT NULL,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE capi_telemetry ENABLE ROW LEVEL SECURITY;

-- Apply policies (Only service_role can access)
DROP POLICY IF EXISTS "Admins have full access to capi_telemetry" ON capi_telemetry;
CREATE POLICY "Admins have full access to capi_telemetry"
  ON capi_telemetry FOR ALL
  TO service_role
  USING (true);
