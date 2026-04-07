const fs = require('fs');

const path = 'src/server/marketingLeadApi.ts';
let code = fs.readFileSync(path, 'utf8');

const targetStr = 'return `${base}${path}?lead_id=${encodeURIComponent(leadId)}&lead_source=${encodeURIComponent(source)}`;';
const newStr = 'const sig = generateLeadSignature(leadId);\n  return `${base}${path}?lead_id=${encodeURIComponent(leadId)}&lead_source=${encodeURIComponent(source)}&sig=${encodeURIComponent(sig)}`;';

if (code.includes(targetStr)) {
  code = code.replace(targetStr, newStr);
  fs.writeFileSync(path, code);
}
