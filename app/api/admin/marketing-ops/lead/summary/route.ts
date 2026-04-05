import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../../_lib/supabaseAdmin";
import { requireLiveAuth } from "../../../../../../src/modules/dawayir-live/server/auth";
import { getClient as getGeminiClient } from "../../../../../../server/gemini/_shared";

export const dynamic = "force-dynamic";

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

  try {
    const genAI = getGeminiClient();
    if (!genAI) {
      return NextResponse.json({
        ok: true,
        summary: "محرك التلخيص الذكي غير مهيأ الآن، لكن بيانات العميل ما زالت متاحة للمراجعة اليدوية.",
        state: "COOLDOWN"
      });
    }

    // 1. Fetch sessions for this lead
    const { data: routingEvents } = await supabase
      .from("routing_events")
      .select("session_id")
      .or(`lead_id.eq.${leadId},email.eq.${email}`);

    const sessionIds = (routingEvents || []).map((r: any) => r.session_id);
    
    if (sessionIds.length === 0) {
      return NextResponse.json({ 
        ok: true, 
        summary: "لم يتم رصد أي نشاط لهذه الروح بعد في المجال الحيوي للمنصة.",
        state: "GHOST" 
      });
    }

    // 2. Fetch Journey Events
    const { data: events } = await supabase
      .from("journey_events")
      .select("type, payload, created_at")
      .in("session_id", sessionIds)
      .order("created_at", { ascending: true });

    if (!events || events.length === 0) {
      return NextResponse.json({ 
        ok: true, 
        summary: "الروح دخلت المدار بس لسه معملتش أي تفاعل حقيقي (No Events).",
        state: "IDLE" 
      });
    }

    // 3. Prepare Prompt for Gemini
    const journeyText = events.map((e: any) => `[${e.created_at}] Action: ${e.type}, Detail: ${JSON.stringify(e.payload)}`).join('\n');

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are the "Sovereign Oracle" of the Al-Rehla platform. Your job is to analyze a lead's journey data and provide a sharp, deep, and intuitive psychological summary in Egyptian Slang.
      
      User Journey Data:
      ${journeyText}
      
      Instructions:
      1. Be analytical but use the "Sovereign/Oracle" persona (Egyptian dialect).
      2. Provide a 1-sentence summary of their behavior.
      3. Determine their "Psychological State" from these options: [SEEKER, SKEPTIC, READY_FOR_CHANGE, STUCK, GHOST, CURIOUS].
      
      Output ONLY as JSON:
      {
        "summary": "Egyptian slang summary here",
        "state": "STATE_HERE"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Cleanup potential markdown formatting
    const cleanJson = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const data = JSON.parse(cleanJson);

    return NextResponse.json({ ok: true, ...data });

  } catch (error: any) {
    console.error("[marketing/lead/summary] AI Error:", error);
    return NextResponse.json({ 
      ok: true, 
      summary: "الأوراكل في حالة تأمل (AI Error). حاول مرة تانية كمان شوية.",
      state: "COOLDOWN" 
    });
  }
}
