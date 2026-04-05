const fs = require('fs');

async function countUsers() {
  const url = 'https://acvcnktpsbayowhurcmn.supabase.co/rest/v1/profiles?select=id';
  const roleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjdmNua3Rwc2JheW93aHVyY21uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQxNDA5OSwiZXhwIjoyMDg1OTkwMDk5fQ.EU428drssoyAgitVE9AIgZZ5xC-2mb5uOs2cqnv1GI0';

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': roleKey,
        'Authorization': `Bearer ${roleKey}`,
        'Range-Unit': 'items',
        'Prefer': 'count=exact'
      }
    });

    const count = res.headers.get('content-range');
    console.log(`Total Leads/Profiles: ${count ? count.split('/')[1] : 'Unknown'}`);
  } catch (e) {
    console.error(e);
  }
}

countUsers();
