-- Table for Lanterns of the Travelers
CREATE TABLE IF NOT EXISTS sullam_lanterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  traveler_id TEXT REFERENCES profiles(id) ON DELETE SET NULL, -- Anonymised at extraction
  growth_area TEXT NOT NULL, -- 'personal', 'career', 'social', etc
  content_type TEXT NOT NULL DEFAULT 'text',
  content_payload TEXT NOT NULL,
  resonance_count INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE sullam_lanterns ENABLE ROW LEVEL SECURITY;

-- Everyone can read lanterns (they will be returned anonymously)
DROP POLICY IF EXISTS "Anyone can read lanterns" ON sullam_lanterns;
CREATE POLICY "Anyone can read lanterns"
  ON sullam_lanterns FOR SELECT
  USING (true);

-- Authenticated users can insert lanterns
DROP POLICY IF EXISTS "Authenticated users can leave lanterns" ON sullam_lanterns;
CREATE POLICY "Authenticated users can leave lanterns"
  ON sullam_lanterns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = traveler_id OR traveler_id IS NULL);

-- Everyone can increment the resonance count (we can enforce this in RPC later if need be, but for MVP let service_role handle increments or allow UPDATE where only resonance_count increments)
-- To be safe, we will let an edge function with service_role handle resonance increments
