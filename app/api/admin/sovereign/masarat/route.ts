/* eslint-disable @typescript-eslint/ban-ts-comment */
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../_lib/supabaseAdmin";
import { sanitizePhone } from "../../../../../src/server/marketingLeadUtils";
// @ts-ignore — external package may not be installed locally
import { quickAnalyze } from "@alrehla/masarat";
import { requireAdmin } from "@/server/requireAdmin";

const isUUID = (id: string | null | undefined) =>
  typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Sovereign Engine configuration missing" }, { status: 401 });
    }
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ ok: false, error: "Missing sessionId" }, { status: 400 });
    }

    // 1. Fetch Session Data (including the newly added user_id and client_phone)
    const { data: session } = await supabaseAdmin
      .from("sessions")
      .select("client_name, client_phone, user_id, notes, goals, session_type")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ ok: false, error: "Session not found" }, { status: 404 });
    }

    // 2. Fetch Sovereign Context (Hub-and-Spoke data)
    let sovereignContext = "";
    let linkedUserId = isUUID(session.user_id) ? session.user_id : null;

    // If session isn't explicitly linked to a valid user_id, try to find one by phone
    if (!linkedUserId && session.client_phone) {
      const phoneParsed = sanitizePhone(session.client_phone);
      if (phoneParsed?.normalized) {
        const { data: lead } = await supabaseAdmin
          .from("marketing_leads")
          .select("profile_id")
          .eq("phone_normalized", phoneParsed.normalized)
          .maybeSingle();

        if (lead?.profile_id && isUUID(lead.profile_id)) {
          linkedUserId = lead.profile_id;
        }
      }
    }

    // If we have a valid user identity, pull the Sovereign Journey Map
    if (linkedUserId && isUUID(linkedUserId)) {
      const { data: mapData } = await supabaseAdmin
        .from("journey_maps")
        .select("transformation_diagnosis, ai_interpretation")
        .eq("user_id", linkedUserId)
        .maybeSingle();

      if (mapData) {
        sovereignContext = `
[سياق سيادي - ملف المسافر]:
- التشخيص السلوكي السابق: ${mapData.transformation_diagnosis || "غير متوفر"}
- رؤى الذكاء الاصطناعي (Sovereign Insight): ${mapData.ai_interpretation || "غير متوفر"}
-------------------------
`;
      }
    }

    // Prepare inference payload with injected context
    const sessionInfo = [
      session.notes ? `ملاحظات الجلسة: ${session.notes}` : "",
      session.goals ? `أهداف العميل: ${session.goals}` : "",
      `نوع التدخل: ${session.session_type}`
    ].filter(Boolean).join(" | ");

    const inputForInference = sovereignContext 
      ? `${sovereignContext}\n${sessionInfo}`
      : (sessionInfo || "لا توجد تفاصيل. حالة قياسية بناء على نوع الجلسة.");

    // 3. Trigger Inference via Masarat Engine
    let engineResult: any;
    try {
      engineResult = quickAnalyze ? quickAnalyze(inputForInference) : { patterns: [], feedback: "تحليل تشغيلي أولي." };
    } catch (e) {
      console.error("[Masarat API] Engine Core Error:", e);
      engineResult = { patterns: [], feedback: "حدث خطأ أثناء الاتصال بالمحرك." };
    }

    // Build the AI Summary
    const diagnosticText = engineResult.feedback || engineResult.insightLine || "تم تحليل المسارات بصورة مبدئية.";
    const patterns = Array.isArray(engineResult.patterns) ? engineResult.patterns : [];
    const patternsText = patterns.length > 0 
      ? `الأنماط المكتشفة: ${patterns.join("، ")}` 
      : "لم يتم رصد أنماط حرجة.";

    const aiSummary = `📝 تقرير مسارات لـ ${session.client_name}:\n\nالتشخيص الشامل: ${diagnosticText}\n${patternsText}\n\nالإجراء المقترح: مراجعة خطة العمل بناءً على محددات الجلسة والملف السيادي للمسافر.`;

    // 4. Save Summary and update sync flag
    const updatePayload: any = { 
      ai_summary: aiSummary,
      status: "active",
      is_sovereign_captured: !!sovereignContext
    };
    
    // Only update user_id if we actually resolved it to avoid overwriting existing valid links
    if (linkedUserId) {
      updatePayload.user_id = linkedUserId;
    }

    await supabaseAdmin.from("sessions").update(updatePayload).eq("id", sessionId);

    return NextResponse.json({ 
      ok: true, 
      ai_summary: aiSummary,
      engine_raw: engineResult,
      is_sovereign_synced: !!sovereignContext
    });

  } catch (error: any) {
    console.error("[Masarat API] Failure:", error);
    return NextResponse.json({ ok: false, error: error.message || "Failed to trigger Masarat Engine" }, { status: 500 });
  }
}
