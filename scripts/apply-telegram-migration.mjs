import { readFile } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnvLocal() {
  try {
    const path = join(ROOT, '.env.local');
    if (!existsSync(path)) {
      console.error('.env.local is missing');
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
  if (!url || !url.startsWith('postgres')) {
    console.error('SUPABASE_DB_URL missing');
    process.exit(1);
  }

  const sqlPath = join(ROOT, 'supabase', 'migrations', '20260331000000_create_telegram_chat_history.sql');
  if (!existsSync(sqlPath)) {
      console.error(`Migration not found at: ${sqlPath}`);
      process.exit(1);
  }
  let sql = await readFile(sqlPath, 'utf8');

  // Skip SSL strict checking if it's a local/development neon or supabase connection without certs (Supabase connection string handles it)
  // Usually the pg driver default is fine.
  const client = new pg.Client({ connectionString: url });
  try {
    await client.connect();
    await client.query(sql);
    console.log('Successfully applied 20260331000000_create_telegram_chat_history.sql');
  } catch (err) {
    console.error('Error applying migration:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
