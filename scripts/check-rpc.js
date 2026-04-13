const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:Wm0SVFd6tZ5Xyfqa@db.acvcnktpsbayowhurcmn.supabase.co:5432/postgres' });
client.connect().then(() => {
  return client.query(`
    select p.proname, pg_get_function_arguments(p.oid)
    from pg_proc p
    where p.proname = 'upsert_marketing_lead_v2';
  `);
}).then(res => {
  console.log(res.rows);
  client.end();
}).catch(console.error);
