-- Atomic increment for lantern resonance
CREATE OR REPLACE FUNCTION increment_lantern_resonance(lantern_id UUID)
RETURNS integer AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE sullam_lanterns
  SET resonance_count = resonance_count + 1
  WHERE id = lantern_id
  RETURNING resonance_count INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
