import { createClient } from "@supabase/supabase-js";
import { buildUnsubToken } from "@/lib/marketing/unsubToken";

export const dynamic = "force-dynamic";

// ─── GET — handle unsubscribe click ──────────────────────────────────────────
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const token = url.searchParams.get("token");

  if (!id || !token) {
    return unsubPage("❌ رابط غير صحيح", false);
  }

  // Get lead email to verify the token
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    { auth: { persistSession: false } }
  );

  const { data: lead, error } = await supabase
    .from("marketing_leads")
    .select("email, unsubscribed")
    .eq("lead_id", id)
    .maybeSingle();

  if (error || !lead) {
    return unsubPage("❌ الرابط غير صحيح أو منتهي الصلاحية", false);
  }

  // Verify HMAC token
  const expectedToken = buildUnsubToken(id, lead.email as string);
  if (token !== expectedToken) {
    return unsubPage("❌ توقيع الرابط غير صحيح", false);
  }

  // Already unsubscribed
  if (lead.unsubscribed) {
    return unsubPage("✅ بريدك الإلكتروني بالفعل خارج قائمة الإرسال", true);
  }

  // Mark as unsubscribed
  const { error: updateError } = await supabase
    .from("marketing_leads")
    .update({
      unsubscribed: true,
      unsubscribed_at: new Date().toISOString(),
    })
    .eq("lead_id", id);

  if (updateError) {
    return unsubPage("⚠️ حدث خطأ — يرجى المحاولة مرة أخرى", false);
  }

  // Cancel pending outreach queue for this lead
  await supabase
    .from("marketing_lead_outreach_queue")
    .update({ status: "cancelled" })
    .eq("lead_id", id)
    .eq("status", "pending");

  return unsubPage("✅ تم إلغاء اشتراكك بنجاح — لن تصلك رسائل أخرى", true);
}

// ─── HTML Response ────────────────────────────────────────────────────────────
function unsubPage(message: string, success: boolean): Response {
  const color = success ? "#10b981" : "#ef4444";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.alrehla.app";
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>إلغاء الاشتراك — الرحلة</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0a0a12;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:'Segoe UI',Arial,sans-serif;direction:rtl}
    .card{background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:48px 40px;text-align:center;max-width:440px;width:90%}
    .icon{font-size:48px;margin-bottom:20px}
    h1{font-size:20px;font-weight:900;color:#fff;margin-bottom:12px}
    p{color:#64748b;font-size:14px;line-height:1.7;margin-bottom:24px}
    a{display:inline-block;padding:12px 32px;background:${color};color:#fff;font-weight:700;font-size:14px;text-decoration:none;border-radius:12px}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? "🌙" : "⚠️"}</div>
    <h1>${message}</h1>
    <p>${success ? "شكراً لك — نتمنى لك كل خير حتى خارج قائمتنا." : "من فضلك حاول مرة أخرى أو تواصل معنا."}</p>
    <a href="${appUrl}">العودة للرحلة →</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
