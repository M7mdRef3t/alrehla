const fs = require('fs');
const file = 'src/services/resonanceMonitor.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/await supabase!/g, 'await supabase');
fs.writeFileSync(file, code);
