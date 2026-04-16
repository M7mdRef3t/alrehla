import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const token = process.env.META_CONVERSIONS_API_TOKEN;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase config");
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function sendMetaPurchase(ticketId, email, phone, amount) {
  if (!pixelId || !token) {
    console.warn("Skipping CAPI - missing config");
    return;
  }

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: `purchase_${ticketId}`,
        event_source_url: "https://alrehla.app/activation",
        action_source: "website",
        user_data: {
          em: email ? crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex") : undefined,
          ph: phone ? crypto.createHash("sha256").update(phone.replace(/[^\d]/g, "")).digest("hex") : undefined,
        },
        custom_data: {
          value: parseFloat(amount) || 150,
          currency: "EGP"
        }
      },
    ],
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    const result = await res.json();
    console.log(`[CAPI] ${ticketId} status: ${res.status}`, result);
    
    // Log to telemetry table
    await db.from("capi_telemetry").insert([{
       event_name: "Purchase",
       event_id: `purchase_${ticketId}`,
       status: res.ok ? "success" : "failed",
       response_code: res.status,
       payload: payload,
       error_message: res.ok ? null : JSON.stringify(result)
    }]);

  } catch (err) {
    console.error(`[CAPI] Error for ${ticketId}:`, err);
  }
}

async function approveTicket(ticketId) {
  console.log(`\n--- Processing Ticket: ${ticketId} ---`);
  
  const { data: ticket, error: fetchErr } = await db
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .single();

  if (fetchErr || !ticket) {
    console.error(`Ticket ${ticketId} not found`);
    return;
  }

  const metadata = ticket.metadata || {};
  const { email, phone, user_id, amount } = metadata;

  // 1. Update Marketing Lead
  if (email || phone) {
    const query = db.from("marketing_leads").update({ status: "activated" });
    if (email) query.eq("email", email);
    else if (phone) query.eq("phone", phone);
    
    const { error: mErr } = await query;
    console.log(`Marketing Lead Update: ${mErr ? "FAILED" : "SUCCESS"}`);
  }

  // 2. Update Profile & Journey
  if (user_id || email) {
    const query = db.from("profiles").update({ 
      subscription_status: "active",
      journey_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
    if (user_id) query.eq("user_id", user_id);
    else query.eq("email", email);
    
    const { error: pErr } = await query;
    console.log(`Profile Subscription Update: ${pErr ? "FAILED" : "SUCCESS"}`);
  }

  // 3. Trigger CAPI
  await sendMetaPurchase(ticketId, email, phone, amount);

  // 4. Resolve Ticket
  const { error: rErr } = await db.from("support_tickets").update({ 
    status: "resolved",
    metadata: { ...metadata, approved_by_script: true, approved_at: new Date().toISOString() }
  }).eq("id", ticketId);
  console.log(`Ticket Resolution: ${rErr ? "FAILED" : "SUCCESS"}`);
}

async function main() {
  const ids = [
    "8b8e2101-4470-45e2-ac36-13a70464ca8b",
    "fcd76d22-d27b-43cb-bb70-607cc52070f6",
    "a99fcc5c-27fc-42c1-a79d-eb8add4b1729",
    "4984d2d4-8671-4d36-8c25-134df53d6520",
    "83caaa6c-cbcc-425c-9e9f-2cd8b88ef351",
    "d850bea6-0145-43ec-a4b3-ac88a49e0ec8",
    "a6bff916-77d8-445b-b257-01007f1c6d10"
  ];

  console.log(`Approvng ${ids.length} tickets...`);
  for (const id of ids) {
    await approveTicket(id);
  }
  console.log("\nQueue Processing Complete.");
}

main().catch(console.error);
