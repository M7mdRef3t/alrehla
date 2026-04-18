import { NextResponse, NextRequest } from "next/server";
import { getSupabaseAdminClient } from "../../../_lib/supabaseAdmin";
import { requireAdmin } from "@/server/requireAdmin";

// POST /api/admin/sovereign/whatsapp
// Pushes session summary to the client's WhatsApp via Meta API
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ ok: false, error: "Missing sessionId" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "System unconfigured" }, { status: 500 });
    }

    // 1. Fetch Session
    const { data: session } = await supabase
      .from("sessions")
      .select("client_name, client_phone, ai_summary, status")
      .eq("id", sessionId)
      .single();

    if (!session || !session.client_phone) {
      return NextResponse.json({ ok: false, error: "Session or Phone not found" }, { status: 404 });
    }

    if (!session.ai_summary) {
      return NextResponse.json({ ok: false, error: "No AI Summary to send. Please generate one first." }, { status: 400 });
    }

    // 2. Import WhatsApp Service
    const { WhatsAppCloudService } = await import("@/services/whatsappCloudService");
    
    // Format Phone
    // Ensures generic numbers like "01xxxx" are normalized if they lack country codes (Assuming Egyptian +20)
    let phone = session.client_phone.trim();
    if (phone.startsWith("01")) phone = "2" + phone;
    if (phone.startsWith("+")) phone = phone.substring(1);

    // 3. Compose Message (Sovereign Template)
    const message = `أهلاً بك يا ${session.client_name} في الرحلة 🌌\n\nبناءً على جلستنا الأخيرة، إليك ملخص التشخيص المبدئي ومسارات الوعي المخصصة لك:\n\n${session.ai_summary}\n\nنحن هنا لتوجيهك باستمرار.`;

    // 4. Send Message Loop
    const result = await WhatsAppCloudService.sendFreeText(phone, sessionId, message);

    if (!result.success) {
      const isWindowClosed = result.error?.code === 131047;
      return NextResponse.json({ 
        ok: false, 
        error: result.error?.message || "WhatsApp Meta integration blocked.",
        isWindowClosed 
      }, { status: 400 });
    }

    return NextResponse.json({ ok: true, messageId: result.message_id, details: "Sovereign Dispatch Complete." });

  } catch (error: any) {
    console.error("[Sovereign WhatsApp Trigger] Error:", error);
    return NextResponse.json({ ok: false, error: error.message || "Internal Engine Failure" }, { status: 500 });
  }
}
