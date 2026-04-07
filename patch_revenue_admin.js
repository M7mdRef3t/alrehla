const fs = require('fs');

let code = fs.readFileSync('src/ai/revenueAutomation.ts', 'utf8');

// Replace the imports to use createClient
code = code.replace(
  `import { supabase, isSupabaseReady } from "../services/supabaseClient";`,
  `import { createClient } from "@supabase/supabase-js";`
);

// Insert getSupabaseAdmin function
const getAdminFn = `
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey);
}
`;

code = code.replace(
  `import { geminiClient } from "../services/geminiClient";`,
  `${getAdminFn}\nimport { geminiClient } from "../services/geminiClient";`
);

// Update analyzeCurrentMetrics to use getSupabaseAdmin
const analyzeOldStart = `    if (!isSupabaseReady || !supabase) {
      console.warn("⚠️ Supabase is not ready. Returning mock revenue metrics.");
      return this.getMockMetrics();
    }`;

const analyzeNewStart = `    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      console.warn("⚠️ Supabase Admin is not ready. Returning mock revenue metrics.");
      return this.getMockMetrics();
    }`;

code = code.replace(analyzeOldStart, analyzeNewStart);

// Update all supabase.from to supabaseAdmin.from
code = code.replace(/await supabase\n        \.from/g, `await supabaseAdmin\n        .from`);

fs.writeFileSync('src/ai/revenueAutomation.ts', code);
console.log('Successfully patched src/ai/revenueAutomation.ts to use supabaseAdmin');
