import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from("dawayir_ai_decisions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);
    
  if (error) console.error("Error:", error);
  else {
      console.log("Last 10 AI Decisions:");
      data.forEach(d => console.log(`- ${d.created_at} | [${d.type}] ${d.reasoning?.substring(0,60)}...`));
  }
}
check();
