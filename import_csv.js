const fs = require('fs');
const http = require('http');

const filePath = 'c:\\\\Users\\\\moham\\\\Downloads\\\\energy_map_eg_v1_ad_01_Leads_2026-03-19_2026-04-02.csv';
const fileContent = fs.readFileSync(filePath, 'utf16le');

// Use regex to properly split while avoiding empty trailing lines
const lines = fileContent.split(/\r?\n/).filter(l => l.trim().length > 0);

const headers = lines[0].split('\t').map(h => h.trim());

// Map column indices safely based on Facebook's dynamic columns
const emailIdx = headers.indexOf('email');
const phoneIdx = headers.indexOf('phone_number');
const nameIdx = headers.indexOf('full_name');
const campIdx = headers.indexOf('campaign_name');
const adsetIdx = headers.indexOf('adset_name');
const adIdx = headers.indexOf('ad_name');
const statusIdx = headers.indexOf('lead_status');

const validLeads = [];

for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t').map(c => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < headers.length - 2) continue; // safety check
    
    // Some lines might be test leads from FB ("is_organic")
    // Let's import them anyway, the API will dedupe nicely.
    
    validLeads.push({
        email: emailIdx >= 0 ? cols[emailIdx]: null,
        phone: phoneIdx >= 0 ? cols[phoneIdx]: null,
        name: nameIdx >= 0 ? cols[nameIdx]: null,
        campaign: campIdx >= 0 ? cols[campIdx]: null,
        adset: adsetIdx >= 0 ? cols[adsetIdx]: null,
        ad: adIdx >= 0 ? cols[adIdx]: null,
        status: statusIdx >= 0 && cols[statusIdx] === 'complete' ? 'new' : 'new'
    });
}

console.log(`Found ${validLeads.length} valid leads to import. Sending to API...`);

const payload = JSON.stringify({
    leads: validLeads,
    sourceType: "meta_instant_form",
    source: validLeads[0]?.ad || "facebook_csv_import"
});

const req = http.request(
    {
        hostname: 'localhost',
        port: 3030,
        path: '/api/marketing/lead/import',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    },
    (res) => {
        let responseBody = '';
        res.on('data', chunk => responseBody += chunk);
        res.on('end', () => {
            console.log(`Response Status: ${res.statusCode}`);
            console.log(`Response Body: ${responseBody.substring(0, 500)}...`);
            process.exit(0);
        });
    }
);

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
    process.exit(1);
});

req.write(payload);
req.end();
