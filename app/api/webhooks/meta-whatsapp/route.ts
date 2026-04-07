import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../_lib/supabaseAdmin";

/**
 * Meta WhatsApp Webhook
 * Handles Challenge verification (GET) and status updates (POST).
 */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode && token) {
    if (mode === "subscribe" && token === process.env.META_WA_VERIFY_TOKEN) {
      console.log("[WhatsAppWebhook] Webhook verified successfully.");
      return new Response(challenge, { status: 200 });
    } else {
      return new Response("Forbidden", { status: 403 });
    }
  }
  return new Response("Not Found", { status: 404 });
}

export async function POST(req: Request) {
  const body = await req.json();
  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return NextResponse.json({ ok: false, error: "missing_supabase_config" }, { status: 503 });
  }

  // Meta sends statuses for delivery tracking
  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const statuses = value?.statuses;

  if (statuses && statuses.length > 0) {
    for (const status of statuses) {
      const recipientId = status.recipient_id;
      const statusType = status.status; // delivered, read, failed

      if (statusType === "delivered" || statusType === "read") {
        // If delivered, we can confidently mark it as verified
        // We'll need a way to map Phone to Lead ID or just update by phone_normalized
        // For precision, we'll prefix with + for cleaning if needed
        const phoneNormalized = `+${recipientId.replace(/\D/g, "")}`;
        
        const { data: leads } = await supabaseAdmin
          .from("marketing_leads")
          .select("lead_id, metadata")
          .eq("phone_normalized", phoneNormalized)
          .order("created_at", { ascending: false })
          .limit(1);

        if (leads && leads.length > 0) {
          const lead = leads[0];
          const updatedMetadata = {
            ...(lead.metadata || {}),
            whatsapp_status: "verified",
            whatsapp_delivery_id: status.id,
            whatsapp_validated_at: new Date().toISOString()
          };

          await supabaseAdmin
            .from("marketing_leads")
            .update({ metadata: updatedMetadata })
            .eq("lead_id", lead.lead_id);

          console.log(`[WhatsAppWebhook] Lead ${lead.lead_id} marked as verified (Phone: ${recipientId})`);
        }
      } else if (statusType === "failed") {
        console.error(`[WhatsAppWebhook] Delivery failed for ${recipientId}:`, status.errors);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
