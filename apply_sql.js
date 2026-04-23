const fs = require('fs');
const { Client } = require('pg');

const dbUrl = 'postgresql://postgres:Wm0SVFd6tZ5Xyfqa@db.acvcnktpsbayowhurcmn.supabase.co:5432/postgres';
const file2 = 'supabase/migrations/20260423232300_create_success_stories.sql';

async function run() {
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  console.log('Connected to DB');

  try {
    const sql2 = fs.readFileSync(file2, 'utf8');
    await client.query(sql2);
    console.log('Successfully applied ' + file2);
  } catch (err) {
    console.error('Error applying SQL:', err);
  } finally {
    await client.end();
  }
}

run();
