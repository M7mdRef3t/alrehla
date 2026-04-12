import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function dumpMissingLeads() {
  const { data, error } = await supabase
    .from("marketing_leads")
    .select("id, name, email, phone_normalized, metadata")
    .is("phone_normalized", null);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Found ${data.length} leads missing phone.`);
  data.forEach(lead => {
    console.log(`Lead: ${lead.name} (${lead.email})`);
    console.log(`Metadata Keys: ${Object.keys(lead.metadata || {}).join(", ")}`);
    if (lead.metadata?.raw_fields) {
        console.log(`Raw Fields:`, JSON.stringify(lead.metadata.raw_fields, null, 2));
    } else {
        console.log(`No raw_fields found.`);
    }
    console.log("---");
  });
}

dumpMissingLeads();
