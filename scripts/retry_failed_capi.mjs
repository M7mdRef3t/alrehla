import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const token = process.env.META_CONVERSIONS_API_TOKEN;

if (!supabaseUrl || !supabaseServiceKey || !pixelId || !token) {
  console.error("Missing configuration in .env.local");
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function main() {
  console.log("Checking for failed CAPI events to retry...");
  
  const { data: failedEvents, error } = await db
    .from("capi_telemetry")
    .select("*")
    .eq("status", "failed")
    .ilike("error_message", "%expired%"); // Only retry token-expired issues

  if (error) {
    console.error("Error fetching failed events:", error);
    return;
  }

  if (!failedEvents || failedEvents.length === 0) {
    console.log("No failed events found with expired token error.");
    return;
  }

  console.log(`Found ${failedEvents.length} events to retry. Current Token: ${token.substring(0, 10)}...`);

  for (const event of failedEvents) {
    console.log(`\nRetrying: ${event.event_name} (${event.event_id})`);
    
    // We reuse the saved payload but replace nothing as the structure is standard
    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event.payload)
      });
      
      const result = await res.json();
      
      if (res.ok) {
        console.log(`SUCCESS: Sent ${event.event_id}`);
        // Mark as success in telemetry to avoid double retry
        await db.from("capi_telemetry").update({
          status: "success",
          response_code: res.status,
          error_message: null,
          metadata: { retried_at: new Date().toISOString() }
        }).eq("id", event.id);
      } else {
        console.warn(`FAILED again: ${res.status}`, result);
        await db.from("capi_telemetry").update({
          response_code: res.status,
          error_message: JSON.stringify(result)
        }).eq("id", event.id);
      }
    } catch (err) {
      console.error(`Network error for ${event.event_id}:`, err);
    }
  }

  console.log("\nRetry process completed.");
}

main().catch(console.error);
