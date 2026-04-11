const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
function getEnv(key) {
  const line = envLocal.split('\n').find(l => l.startsWith(key + '='));
  return line ? line.split('=')[1].replace(/['"]/g, '').trim() : '';
}

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLeads() {
  const { data, error } = await supabase.from('marketing_leads').select('id, name, email, metadata').ilike('name', '%هبة%');
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

checkLeads();
