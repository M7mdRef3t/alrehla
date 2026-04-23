import pg from 'pg';
import fs from 'fs';

const { Client } = pg;
const dbUrl = 'postgresql://postgres:Wm0SVFd6tZ5Xyfqa@db.acvcnktpsbayowhurcmn.supabase.co:5432/postgres';

const client = new Client({
  connectionString: dbUrl,
});

async function run() {
  await client.connect();
  const sql = fs.readFileSync('supabase/migrations/20260423232300_create_success_stories.sql', 'utf8');
  try {
    await client.query(sql);
    console.log('Migration applied successfully');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
