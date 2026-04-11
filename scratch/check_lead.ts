import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkLead() {
  const { data, error } = await supabase
    .from("marketing_leads")
    .select("name, email, phone, phone_normalized, metadata")
    .ilike("name", "%Hiba Omer%")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error:", error);
    return;
  }

  if (!data) {
    console.log("No lead found with name Hiba Omer.");
    return;
  }

  console.log("Lead Found:");
  console.log("Name:", data.name);
  console.log("Email:", data.email);
  console.log("Phone:", data.phone);
  console.log("Phone Normalized:", data.phone_normalized);
  console.log("Metadata:", JSON.stringify(data.metadata, null, 2));
}

checkLead();
