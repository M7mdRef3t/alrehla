import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../_lib/supabaseAdmin";
import { requireLiveAuth } from "../../../../../src/modules/dawayir-live/server/auth";
import { sanitizePhone } from "../../../../../src/server/marketingLeadUtils";

export const dynamic = "force-dynamic";

/**
 * GET: Fetch lead history and routing events
 */
export async function GET(req: Request) {
  const auth = await requireLiveAuth(req as any);
  if ("status" in auth) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("id");
  const email = searchParams.get("email");

  if (!leadId && !email) {
    return NextResponse.json({ ok: false, error: "missing_id_or_email" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "no_supabase" }, { status: 503 });

  // 1. Fetch Routing Events for this lead
  const { data: routingEvents } = await supabase
    .from("routing_events")
    .select("session_id, created_at, metadata")
    .or(`lead_id.eq.${leadId},email.eq.${email}`);

  const sessionIds = (routingEvents || []).map(r => r.session_id);
  
  // 2. Fetch Journey Events for these sessions
  let history: any[] = [];
  if (sessionIds.length > 0) {
     const { data: events } = await supabase
       .from("journey_events")
       .select("type, payload, created_at")
       .in("session_id", sessionIds)
       .order("created_at", { ascending: true });
     history = events || [];
  }

  return NextResponse.json({ ok: true, history, routing: routingEvents || [] });
}

/**
 * PATCH: Update lead details (name, phone, email, etc.)
 */
export async function PATCH(req: Request) {
  const auth = await requireLiveAuth(req as any);
  if ("status" in auth) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name, phone_normalized, email, source_type, campaign, status, note, amount_egp } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "missing_lead_id" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
    }

    const phoneParsed = typeof phone_normalized === "string" && phone_normalized.trim()
      ? sanitizePhone(phone_normalized)
      : null;

    const { data: existingLead } = await supabase
      .from("marketing_leads")
      .select("metadata, phone_raw")
      .eq("id", id)
      .maybeSingle();

    const existingMetadata =
      existingLead?.metadata && typeof existingLead.metadata === "object"
        ? (existingLead.metadata as Record<string, unknown>)
        : {};
    const nextMetadata = { ...existingMetadata };
    if (phoneParsed?.normalized) {
      nextMetadata.missing_phone = false;
    }
    if (typeof amount_egp === 'number') {
      nextMetadata.amount = amount_egp;
      nextMetadata.currency = "EGP";
    }

    const { error } = await supabase
      .from("marketing_leads")
      .update({
        name,
        phone: phoneParsed?.normalized ?? null,
        phone_normalized: phoneParsed?.normalized ?? null,
        phone_raw: phoneParsed?.raw ?? existingLead?.phone_raw ?? null,
        email,
        source_type,
        campaign,
        status,
        note,
        metadata: nextMetadata,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      console.error("[marketing-ops/lead] Update error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[marketing-ops/lead] Unexpected error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST: Complex actions (resend email, mark manual, sync from meta)
 */
export async function POST(req: Request) {
  const auth = await requireLiveAuth(req as any);
  if ("status" in auth) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email, action, id } = body;

    const supabase = getSupabaseAdminClient();
    if (!supabase) return NextResponse.json({ ok: false, error: "no_supabase" }, { status: 503 });

    // --- Action: Mark WhatsApp Sent ---
    if (action === "mark_whatsapp") {
      if (!id) return NextResponse.json({ ok: false, error: "missing_lead_id" }, { status: 400 });
      
      const { data: existingLead } = await supabase.from("marketing_leads").select("metadata").eq("id", id).maybeSingle();
      const meta = (existingLead?.metadata as Record<string, unknown>) || {};

      const { error } = await supabase.from("marketing_leads").update({
        metadata: {
          ...meta,
          whatsapp_sent: true,
          whatsapp_sent_at: new Date().toISOString()
        }
      }).eq("id", id);
      
      return NextResponse.json({ ok: !error, error: error?.message });
    }

    // --- Action: Sync with Meta ---
    if (action === "sync_with_meta") {
      if (!id) return NextResponse.json({ ok: false, error: "missing_lead_id" }, { status: 400 });

      // 1. Get meta_lead_id from metadata
      const { data: lead, error: fetchErr } = await supabase
        .from("marketing_leads")
        .select("metadata, name, email, note")
        .eq("id", id)
        .single();

      if (fetchErr || !lead) return NextResponse.json({ ok: false, error: "lead_not_found" }, { status: 404 });

      // Meta Lead ID can be in leadgen_id or metadata.meta_lead_id
      let metaLeadId = 
        (lead.metadata as any)?.meta_lead_id || 
        (lead.metadata as any)?.leadgen_id ||
        (lead.metadata as any)?.id; // Sometimes the root id is the leadgen_id
      
      // If it is a raw webhook dump
      if (!metaLeadId && (lead.metadata as any)?.entry?.length > 0) {
          const entry = (lead.metadata as any).entry[0];
          if (entry.changes?.length > 0) {
              metaLeadId = entry.changes[0]?.value?.leadgen_id;
          }
      }

      if (!metaLeadId) {
          // Check if we can find it in journey events or routing
          const { data: route } = await supabase.from("routing_events").select("metadata").eq("lead_id", id).maybeSingle();
          metaLeadId = (route?.metadata as any)?.leadgen_id;
      }

      if (!metaLeadId) {
          console.error("[marketing-ops/lead] Failed to find metaLeadId. Metadata:", lead.metadata);
          return NextResponse.json({ ok: false, error: "no_meta_id_found" }, { status: 400 });
      }

      // 2. Fetch from Meta API
      const { metaLeadsService } = await import("../../../../../src/services/metaLeadsService");
      const metaData = await metaLeadsService.fetchLeadDetails(metaLeadId);

      if (!metaData) return NextResponse.json({ ok: false, error: "meta_api_fetch_failed" }, { status: 500 });

      // 3. Process Fields
      const fields: Record<string, string> = {};
      metaData.field_data.forEach(field => {
        fields[field.name] = field.values[0];
      });

      // Use the utility list of phone fields
      const phoneKeywords = [
        "phone_number", "phone", "phoneNumber", "mobile_number", "mobileNumber", "mobile",
        "whatsapp", "whatsapp_number", "whatsappNumber", "phone_1", "contact_number",
        "هاتف", "موبايل", "رقم", "رقم الهاتف", "رقم الموبايل", "رقم الواتساب"
      ];

      let rawPhone = "";
      for (const k of phoneKeywords) {
        const found = metaData.field_data.find(f => f.name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(f.name.toLowerCase()));
        if (found) {
            rawPhone = found.values[0];
            break;
        }
      }

      const phoneParsed = sanitizePhone(rawPhone);

      const nextMetadata = { 
        ...(lead.metadata as any), 
        raw_fields: fields,
        re_synced_at: new Date().toISOString(),
        missing_phone: !phoneParsed?.normalized
      };

      const { error: updateErr } = await supabase
        .from("marketing_leads")
        .update({
          phone: phoneParsed?.normalized ?? null,
          phone_normalized: phoneParsed?.normalized ?? null,
          phone_raw: phoneParsed?.raw ?? null,
          metadata: nextMetadata,
          note: (lead as any).note ? `${(lead as any).note}\n[SYNC_META] Re-synced at ${new Date().toISOString()}` : `[SYNC_META] Re-synced at ${new Date().toISOString()}`
        })
        .eq("id", id);

      if (updateErr) return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });

      return NextResponse.json({ ok: true, phone: phoneParsed?.normalized });
    }

    // --- Action: Mark Sent Manual ---
    if (action === "mark_sent_manual") {
      if (!email) return NextResponse.json({ ok: false, error: "missing_email" }, { status: 400 });

      const sentAt = new Date().toISOString();
      const { data: leadData } = await supabase
        .from("marketing_leads")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      const { data: existing } = await supabase
        .from("marketing_lead_outreach_queue")
        .select("id")
        .eq("lead_email", email)
        .eq("channel", "email")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("marketing_lead_outreach_queue")
          .update({ status: "sent", sent_at: sentAt, attempts: 1, last_error: null, resend_message_id: 'manual_gmail' })
          .eq("id", existing.id);
      } else {
        await supabase.from("marketing_lead_outreach_queue").insert({
          lead_email: email, lead_id: leadData?.id || null, channel: "email",
          status: "sent", step: 1, attempts: 1, sent_at: sentAt, resend_message_id: 'manual_gmail'
        });
      }

      return NextResponse.json({ ok: true, method: "manual_logged" });
    }

    // --- Action: Resend Email ---
    if (action === "resend_email") {
      if (!email) return NextResponse.json({ ok: false, error: "missing_email" }, { status: 400 });

      // 1. Fetch lead data for personalization
      const { data: leadData } = await supabase
        .from("marketing_leads")
        .select("name, id, unsubscribed")
        .eq("email", email)
        .maybeSingle();

      if ((leadData as any)?.unsubscribed) {
        return NextResponse.json({ ok: false, error: "lead_unsubscribed" }, { status: 400 });
      }

      const leadName = (leadData?.name || "").trim().split(/\s+/)[0] || "";
      const leadId = leadData?.id || "";
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.alrehla.app").replace(/\/$/, "");
      const personalLink = `${appUrl}/go/${leadId}`;

      // 2. Build email HTML
      const { buildMarketingEmail } = await import("@/lib/marketing/emailTemplate");
      let unsubLink = appUrl + "/api/unsubscribe";
      try {
        const { buildUnsubLink } = await import("@/lib/marketing/unsubToken");
        if (leadId) unsubLink = buildUnsubLink(appUrl, leadId, email);
      } catch (error) {
        console.warn("[marketing-ops/lead] Failed to build unsubscribe link, using fallback.", error);
      }

      const subject = `خطوتك الأولى في الرحلة تنتظرك ✦`;
      const html = buildMarketingEmail({ name: leadName || undefined, personalLink, previewText: "خريطة علاقاتك جاهزة — ابدأ الرحلة الآن", _senderName: "فريق عمل", unsubLink });

      // 3. Send via Sovereign Mail Engine
      const from = process.env.SMTP_FROM || process.env.MARKETING_EMAIL_FROM || process.env.REPORT_EMAIL_FROM;
      const { sendEmail: sovereignSend } = await import("../../email/engine");
      const sendResult = await sovereignSend({
        to: email, subject, html, from, replyTo: "hello@alrehla.app", enableTracking: true,
      });

      if (!sendResult.ok) {
        return NextResponse.json({ ok: false, error: `send_failed: ${sendResult.error}` }, { status: 500 });
      }

      // 4. Update queue record
      const sentAt = new Date().toISOString();
      const { data: existing } = await supabase
        .from("marketing_lead_outreach_queue")
        .select("id")
        .eq("lead_email", email)
        .eq("channel", "email")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("marketing_lead_outreach_queue")
          .update({ status: "sent", sent_at: sentAt, attempts: 1, last_error: null, resend_message_id: sendResult.messageId || 'sovereign_smtp' })
          .eq("id", existing.id);
      } else {
        await supabase.from("marketing_lead_outreach_queue").insert({
          lead_email: email, lead_id: leadId || null, channel: "email",
          status: "sent", step: 1, attempts: 1, sent_at: sentAt, resend_message_id: sendResult.messageId || 'sovereign_smtp'
        });
      }

      return NextResponse.json({ ok: true, method: "sent_immediately", engine: "sovereign", messageId: sendResult.messageId });
    }

    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  } catch (error: any) {
    console.error("[marketing-ops/lead] POST error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
