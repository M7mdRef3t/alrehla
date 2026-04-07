import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, getEngineInfo, verifySmtpConnection } from "../engine";

export const dynamic = "force-dynamic";

function buildAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * POST /api/admin/email/send
 * Send single or batch emails via Sovereign Mail Engine (Nodemailer + SMTP).
 *
 * Body: { to, subject, html?, templateId?, variables?, campaignTag?, from? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, html, templateId, variables, campaignTag, from } = body;

    if (!to || !subject) {
      return NextResponse.json({ error: "Missing required: to, subject" }, { status: 400 });
    }

    const supabase = buildAdmin();
    const recipients = Array.isArray(to) ? to : [to];

    // If templateId provided, fetch and hydrate template
    let finalHtml = html || "";
    let finalSubject = subject;

    if (templateId) {
      const { data: template, error: tErr } = await supabase
        .from("email_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (tErr || !template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }

      finalHtml = template.html;
      finalSubject = template.subject;

      // Variable substitution
      if (variables && typeof variables === "object") {
        for (const [key, value] of Object.entries(variables)) {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
          finalHtml = finalHtml.replace(regex, String(value));
          finalSubject = finalSubject.replace(regex, String(value));
        }
      }
    }

    if (!finalHtml) {
      return NextResponse.json({ error: "No HTML content (provide html or templateId)" }, { status: 400 });
    }

    const results: Array<{ email: string; ok: boolean; messageId?: string; error?: string }> = [];

    for (const email of recipients) {
      const trimmedEmail = email.trim();

      // 1) Create email_sends record first (to get tracking ID)
      const { data: sendRecord, error: insertErr } = await supabase
        .from("email_sends")
        .insert({
          to_email: trimmedEmail,
          from_email: from || "Alrehla <team@alrehla.app>",
          subject: finalSubject,
          template_id: templateId || null,
          html_snapshot: finalHtml.substring(0, 100000),
          status: "queued",
          campaign_tag: campaignTag || null,
          metadata: { variables: variables || {}, engine: "sovereign" },
        })
        .select("id")
        .single();

      if (insertErr || !sendRecord) {
        results.push({ email: trimmedEmail, ok: false, error: "DB insert failed" });
        continue;
      }

      // 2) Send via Sovereign Mail Engine (Nodemailer)
      const sendResult = await sendEmail({
        to: trimmedEmail,
        subject: finalSubject,
        html: finalHtml,
        from: from || undefined,
        trackingId: sendRecord.id,
        enableTracking: true,
      });

      if (sendResult.ok) {
        // Update with SMTP messageId and mark as sent/delivered
        await supabase
          .from("email_sends")
          .update({
            resend_id: sendResult.messageId, // Reusing column for SMTP message ID
            status: "delivered", // SMTP 250 = delivered
            metadata: {
              variables: variables || {},
              engine: "sovereign",
              smtp_response: sendResult.response,
            },
          })
          .eq("id", sendRecord.id);

        // Record delivered event
        await supabase.from("email_events").insert({
          email_send_id: sendRecord.id,
          event_type: "delivered",
          metadata: {
            smtp_message_id: sendResult.messageId,
            smtp_response: sendResult.response,
          },
        });

        results.push({ email: trimmedEmail, ok: true, messageId: sendResult.messageId || undefined });
      } else {
        await supabase
          .from("email_sends")
          .update({
            status: "failed",
            metadata: { error: sendResult.error, engine: "sovereign" },
          })
          .eq("id", sendRecord.id);

        results.push({ email: trimmedEmail, ok: false, error: sendResult.error || "Send failed" });
      }
    }

    const successCount = results.filter((r) => r.ok).length;
    const firstError = results.find((r) => !r.ok)?.error;

    return NextResponse.json({
      ok: successCount > 0,
      sent: successCount,
      total: recipients.length,
      engine: "sovereign",
      error: successCount === 0 ? firstError : undefined,
      results,
    });
  } catch (err: any) {
    console.error("[SovereignMailSend] Error:", err);
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}

/**
 * GET /api/admin/email/send
 * Returns engine status and SMTP connection health.
 */
export async function GET() {
  const info = getEngineInfo();
  const health = await verifySmtpConnection();

  return NextResponse.json({
    engine: info,
    smtp: health,
  });
}
