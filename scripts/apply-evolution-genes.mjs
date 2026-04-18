import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnvLocal() {
  try {
    const path = join(ROOT, '.env.local');
    if (!existsSync(path)) {
      console.error('.env.local is missing.');
      process.exit(1);
    }
    const raw = readFileSync(path, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
        value = value.slice(1, -1);
      process.env[key] = value;
    }
  } catch (e) {
    console.error('Error reading .env.local:', e.message);
    process.exit(1);
  }
}

async function main() {
  await loadEnvLocal();
  const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error('SUPABASE_DB_URL missing in .env.local');
    process.exit(1);
  }

  const sql = `
  -- 🧬 Evolutionary Genome Schema Injection
  CREATE TABLE IF NOT EXISTS public.ui_mutations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    component_id text NOT NULL,
    variant_name text NOT NULL,
    variant_path text NOT NULL,
    hypothesis text,
    is_active boolean DEFAULT false,
    resonance_score_delta float DEFAULT 0,
    friction_events_count int DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    activated_at timestamptz,
    deactivated_at timestamptz,
    UNIQUE(component_id, variant_name)
  );

  CREATE INDEX IF NOT EXISTS ui_mutations_active_idx ON ui_mutations (component_id) WHERE is_active = true;

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'ui_mutations'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE ui_mutations;
    END IF;
  END
  $$;
  `;

  const client = new pg.Client({ 
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("🧬 Initiating Alrehla Evolution DNA Injection...");
    await client.connect();
    await client.query(sql);
    console.log("✅ Success! The platform now possesses the DNA for self-evolution (ui_mutations table created).");
  } catch (err) {
    console.error("❌ Evolution Injection Failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
