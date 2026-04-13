const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:Wm0SVFd6tZ5Xyfqa@db.acvcnktpsbayowhurcmn.supabase.co:5432/postgres' });
client.connect().then(() => {
  return client.query(`
    SELECT event_object_table AS table_name, trigger_name, action_timing, event_manipulation AS event, action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'marketing_leads';
  `);
}).then(res => {
  console.log(res.rows);
  client.end();
}).catch(console.error);
