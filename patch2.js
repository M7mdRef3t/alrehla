const fs = require('fs');

const file = 'src/ai/revenueAutomation.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'const { data: profiles, error } = await supabase',
  'if (!supabase) return null;\n\n      const { data: profiles, error } = await supabase'
);

fs.writeFileSync(file, code);
console.log('Patch applied.');
