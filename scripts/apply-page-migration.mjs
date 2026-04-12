import { readFile } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnvLocal() {
  const path = join(ROOT, '.env.local');
  if (existsSync(path)) {
    const raw = readFileSync(path, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvLocal();
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error('No SUPABASE_DB_URL');
  
  const sql = await readFile(join(ROOT, 'supabase', 'migrations', '202604112020_create_dawayir_pages.sql'), 'utf8');
  
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  await client.query(sql);
  console.log('Page migration applied!');
  await client.end();
}
main().catch(console.error);
