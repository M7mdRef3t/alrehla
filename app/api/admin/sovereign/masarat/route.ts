import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../_lib/supabaseAdmin";
// @ts-ignore
import { quickAnalyze } from "@alrehla/masarat";

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ ok: false, error: "Missing sessionId" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "System unconfigured" }, { status: 500 });
    }

    // 1. Fetch Session Data
    const { data: session } = await supabase
      .from("sessions")
      .select("client_name, notes, goals, session_type")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ ok: false, error: "Session not found" }, { status: 404 });
    }

    // Prepare inference payload based on notes and goals
    const payloadInfo = [
      session.notes ? `ملاحظات: ${session.notes}` : "",
      session.goals ? `أهداف: ${session.goals}` : "",
      `نوع الجلسة: ${session.session_type}`
    ].filter(Boolean).join(" | ");

    const inputForInference = payloadInfo || "لا توجد تفاصيل. حالة قياسية بناء على نوع الجلسة.";

    // 2. Trigger Inference via Masarat Engine
    let engineResult: any;
    try {
      engineResult = quickAnalyze ? quickAnalyze(inputForInference) : { patterns: [], feedback: "تحليل تشغيلي أولي." };
    } catch (e) {
      console.error("[Masarat API] Engine Core Error:", e);
      engineResult = { patterns: [], feedback: "حدث خطأ أثناء الاتصال بالمحرك." };
    }

    // Build the AI Summary string from the engine result
    const diagnosticText = engineResult.feedback || engineResult.insightLine || "تم تحليل المسارات بصورة مبدئية.";
    const patterns = Array.isArray(engineResult.patterns) ? engineResult.patterns : [];
    const patternsText = patterns.length > 0 
      ? `الأنماط المكتشفة: ${patterns.join("، ")}` 
      : "لم يتم رصد أنماط حرجة.";

    const aiSummary = `📝 تقرير مسارات لـ ${session.client_name}:\n\nالتشخيص الشامل: ${diagnosticText}\n${patternsText}\n\nالإجراء المقترح: مراجعة خطة العمل بناءً على محددات الجلسة.`;

    // 3. Save Summary Back to Session
    await supabase.from("sessions").update({ 
      ai_summary: aiSummary,
      status: "active" // Progress status
    }).eq("id", sessionId);

    return NextResponse.json({ 
      ok: true, 
      ai_summary: aiSummary,
      engine_raw: engineResult
    });

  } catch (error: any) {
    console.error("[Masarat API] Failure:", error);
    return NextResponse.json({ ok: false, error: error.message || "Failed to trigger Masarat Engine" }, { status: 500 });
  }
}
