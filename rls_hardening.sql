-- RLS Hardening for Alrehla Platform

-- 1. community_posts: Restrict INSERT to owner
ALTER POLICY "Public insert community posts" ON community_posts 
WITH CHECK (auth.uid() = user_id);

-- 2. maraya_artifacts: Restrict ALL to owner
ALTER POLICY "maraya anonymous write artifacts" ON maraya_artifacts
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. journey_events: Restrict INSERT to authenticated session user
ALTER POLICY "journey_events_insert" ON journey_events
WITH CHECK (auth.uid() = user_id);

-- 4. routing_events: Restrict INSERT to authenticated session user (non-anon)
-- ALTER POLICY "routing_events_anon_insert" ON routing_events
-- TO authenticated
-- USING (auth.uid() = (metadata->>'user_id')::uuid)
-- WITH CHECK (auth.uid() = (metadata->>'user_id')::uuid);

-- 5. admin_editorial_ops_runs: Enable RLS and add admin-only policy
ALTER TABLE admin_editorial_ops_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only" ON admin_editorial_ops_runs
FOR ALL TO service_role USING (true) WITH CHECK (true);
