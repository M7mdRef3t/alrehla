/* eslint-disable @typescript-eslint/ban-ts-comment */
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../_lib/supabaseAdmin";
// @ts-ignore — external package may not be installed locally
import { quickAnalyze } from "@alrehla/masarat";

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Sovereign Engine configuration missing" }, { status: 401 });
    }
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ ok: false, error: "Missing sessionId" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "System unconfigured" }, { status: 500 });
    }

    // 1. Fetch Session Data (including the newly added user_id and client_phone)
    const { data: session } = await supabase
      .from("sessions")
      .select("client_name, client_phone, user_id, notes, goals, session_type")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ ok: false, error: "Session not found" }, { status: 404 });
    }

    // 2. Fetch Sovereign Context (Hub-and-Spoke data)
    let sovereignContext = "";
    let linkedUserId = session.user_id;

    // If session isn't explicitly linked to a user_id, try to find one by phone
    if (!linkedUserId && session.client_phone) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", session.client_phone) // This depends on how user_id is stored in profiles (could be auth.uid or a custom id)
        // Note: In some migrations, profiles.user_id is the auth linking. 
        // Let's also check for phone match if there's a phone column, 
        // but for now we follow the "phone is the key" logic.
        .single();
      
      if (profile) linkedUserId = profile.id;
    }

    // If we have a user identity, pull the Sovereign Journey Map
    if (linkedUserId) {
      const { data: mapData } = await supabase
        .from("journey_maps")
        .select("transformation_diagnosis, ai_interpretation")
        .eq("user_id", linkedUserId)
        .single();

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
    await supabase.from("sessions").update({ 
      ai_summary: aiSummary,
      status: "active",
      user_id: linkedUserId, // Update the session with the discovered user_id
      is_sovereign_captured: !!sovereignContext
    }).eq("id", sessionId);

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
