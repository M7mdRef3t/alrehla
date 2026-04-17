import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/server/requireAdmin";
import { sendMetaCapiEvent } from "@/server/metaCapi";
import { WhatsAppCloudService } from "@/services/whatsappCloudService";

export const dynamic = "force-dynamic";

const SUBSCRIPTION_DURATION_DAYS = 30;

function buildAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = buildAdminClient();
  const body = await req.json().catch(() => null);
  const { ticketId, decision, reason } = body || {};

  if (!ticketId || !decision) {
    return NextResponse.json({ error: "Missing ticketId or decision" }, { status: 400 });
  }

  // 1. Fetch the ticket
  const { data: ticket, error: ticketError } = await db
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .single();

  if (ticketError || !ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const metadata = ticket.metadata || {};
  const email = metadata.email;
  const phone = metadata.phone;
  const userId = metadata.user_id;

  if (decision === "approve") {
    // 2. Update Lead status
    if (email || phone) {
      const query = db.from("marketing_leads").update({ status: "activated" });
      if (email) query.eq("email", email);
      else if (phone) query.eq("phone", phone);
      
      const { error: leadErr } = await query;
      if (leadErr) console.error("Failed to update lead status:", leadErr);
    }

    // 3. Update Profile subscription
    if (userId || email) {
      const query = db.from("profiles").update({ 
        subscription_status: "active",
        journey_expires_at: new Date(Date.now() + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString()
      });
      
      if (userId) query.eq("user_id", userId);
      else query.eq("email", email);
      
      const { error: profileErr } = await query;
      if (profileErr) console.error("Failed to update profile status:", profileErr);
    }

    // 4. Trigger Meta CAPI Purchase
    const sourceUrl = metadata.origin || process.env.NEXT_PUBLIC_SITE_URL || "https://alrehla.app/activation";
    await sendMetaCapiEvent({
      eventName: "Purchase",
      eventId: `purchase_${ticketId}`,
      sourceUrl,
      userData: {
        email: email || null,
        phone: phone || null,
      }
    });

    // 5. Resolve Ticket
    await db.from("support_tickets").update({ 
      status: "resolved",
      metadata: { ...metadata, decision: "approved", approved_at: new Date().toISOString() } 
    }).eq("id", ticketId);

    // 6. Automated WhatsApp Activation Hook (Sovereign Loop)
    if (phone) {
      console.log(`[Decision API] Triggering WhatsApp activation for ${phone}`);
      try {
        // Use lead_id if exists, fallback to ticket ref
        const leadIdForWA = metadata.lead_id || `tkt_${ticketId}`;
        await WhatsAppCloudService.validateNumber(phone, leadIdForWA);
      } catch (waErr) {
        console.error("[Decision API] WhatsApp activation hook failed:", waErr);
      }
    }

    return NextResponse.json({ ok: true, message: "Proof approved and user activated." });
  } else {
    // Decision: Reject
    await db.from("support_tickets").update({ 
      status: "closed",
      metadata: { ...metadata, decision: "rejected", reject_reason: reason, rejected_at: new Date().toISOString() } 
    }).eq("id", ticketId);

    return NextResponse.json({ ok: true, message: "Proof rejected." });
  }
}
