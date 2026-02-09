/**
 * تشغيل full-setup.sql على Supabase من التيرمنال
 * يحتاج في .env.local: SUPABASE_DB_URL (Connection string من Project Settings → Database)
 *
 * Usage: node scripts/apply-supabase-setup.mjs
 */

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
      console.error('.env.local غير موجود. انسخ من .env.local.example وضع SUPABASE_DB_URL.');
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
    console.error('قراءة .env.local:', e.message);
    process.exit(1);
  }
}

async function main() {
  await loadEnvLocal();
  const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!url || !url.startsWith('postgres')) {
    console.error('مطلوب SUPABASE_DB_URL (أو DATABASE_URL) في .env.local. من: Supabase → Project Settings → Database → Connection string (URI).');
    process.exit(1);
  }

  const sqlPath = join(ROOT, 'supabase', 'full-setup.sql');
  let sql = await readFile(sqlPath, 'utf8');
  // إزالة التعليق الأخير (ترقية owner) عشان ما ينفذش بالغلط
  sql = sql.replace(/\n-- ---------- ترقية حسابك.*$/s, '').trim();

  const client = new pg.Client({ connectionString: url });
  try {
    await client.connect();
    await client.query(sql);
    console.log('تم تشغيل full-setup.sql بنجاح.');
  } catch (err) {
    console.error('خطأ:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
