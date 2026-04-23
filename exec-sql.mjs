import pg from 'pg';
import fs from 'fs';

const { Client } = pg;
const dbUrl = 'postgresql://postgres:Wm0SVFd6tZ5Xyfqa@db.acvcnktpsbayowhurcmn.supabase.co:5432/postgres';

const client = new Client({
  connectionString: dbUrl,
});

async function run() {
  await client.connect();
  const sql = 'SELECT COUNT(*) FROM success_stories;';
  try {
    const res = await client.query(sql);
    console.log('Success stories count:', res.rows[0].count);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
