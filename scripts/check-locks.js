const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:Wm0SVFd6tZ5Xyfqa@db.acvcnktpsbayowhurcmn.supabase.co:5432/postgres' });
client.connect().then(() => {
  return client.query(`
    SELECT pg_stat_activity.pid, pg_stat_activity.query, pg_stat_activity.state
    FROM pg_stat_activity
    WHERE pg_stat_activity.state != 'idle' AND pg_stat_activity.query ILIKE '%marketing_leads%';
  `);
}).then(res => {
  console.log(res.rows);
  client.end();
}).catch(console.error);
