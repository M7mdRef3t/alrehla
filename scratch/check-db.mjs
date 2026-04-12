import pg from 'pg';
const { Client } = pg;
const dbUrl = 'postgresql://postgres:mm2JMw1iyQiP1l0O@db.acvcnktpsbayowhurcmn.supabase.co:5432/postgres';

const client = new Client({ connectionString: dbUrl });

async function run() {
  await client.connect();
  console.log('--- Database Diagnostics ---');
  
  try {
    // 1. Check for anonymous_id column
    const colRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'marketing_leads' AND column_name = 'anonymous_id';
    `);
    console.log('anonymous_id column exists:', colRes.rowCount > 0);

    // 2. Check for upsert_marketing_lead_v2 RPC and its arguments
    const rpcRes = await client.query(`
      SELECT proname, proargnames
      FROM pg_proc
      WHERE proname = 'upsert_marketing_lead_v2';
    `);
    if (rpcRes.rowCount === 0) {
      console.log('upsert_marketing_lead_v2 RPC does NOT exist');
    } else {
      console.log('RPC found. Arguments:', rpcRes.rows[0].proargnames);
    }
  } catch (err) {
    console.error('Diagnostic query failed:', err.message);
  } finally {
    await client.end();
  }
}

run();
