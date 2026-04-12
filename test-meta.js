const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
function getEnv(key) {
  const line = envLocal.split('\n').find(l => l.startsWith(key + '='));
  return line ? line.split('=')[1].replace(/['"]/g, '').trim() : '';
}

const accessToken = getEnv('META_PAGE_ACCESS_TOKEN');

async function test() {
  if (!accessToken) return console.log('no token');
  
  const resForms = await fetch(`https://graph.facebook.com/v19.0/me/leadgen_forms?access_token=${accessToken}`);
  const forms = await resForms.json();
  console.log("Forms:", JSON.stringify(forms, null, 2));

  if (forms.data && forms.data.length > 0) {
      for (const form of forms.data) {
          console.log(`Fetching leads for form ${form.name} (${form.id})...`);
          const resLeads = await fetch(`https://graph.facebook.com/v19.0/${form.id}/leads?access_token=${accessToken}&limit=5`);
          const leads = await resLeads.json();
          console.log(`Leads for ${form.name}:`, JSON.stringify(leads, null, 2));
      }
  } else {
      // maybe we need to query page -> forms?
      // "me" translates to the Page if it's a Page Access Token
      console.log("No forms found on 'me'. Let's try to query the pages this token has access to.");
  }
}

test();
