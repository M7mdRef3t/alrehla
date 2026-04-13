const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:Wm0SVFd6tZ5Xyfqa@db.acvcnktpsbayowhurcmn.supabase.co:5432/postgres' });
client.connect().then(() => {
  return client.query(`
    select prosrc from pg_proc where proname = 'link_identity_v2';
  `);
}).then(res => {
  console.log(res.rows[0].prosrc);
  client.end();
}).catch(console.error);
