import { NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini/shared";
import { getSupabaseAdminClient } from "../_lib/supabaseAdmin";
import { buildLifeAdvisorSystemPrompt } from "@/services/lifeAdvisor";
import type { LifeContext } from "@/services/lifeAdvisor";

/**
 * POST /api/life-advisor
 * ========================
 * Life OS AI endpoint — يستقبل life context + رسائل المستخدم
 * ويرجع رد Jarvis المخصص كمستشار حياة شامل.
 *
 * Request body:
 * {
 *   message: string;           // رسالة المستخدم
 *   context: LifeContext;      // حالة الحياة الشاملة
 *   userId: string;            // لـ token deduction
 *   conversationHistory?: { role: "user"|"model"; content: string }[];
 * }
 *
 * Response:
 * { reply: string; tokensRemaining: number; latencyMs: number }
 */
export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const {
      message,
      context,
      userId,
      conversationHistory = []
    } = body as {
      message: string;
      context: LifeContext;
      userId: string;
      conversationHistory?: { role: "user" | "model"; content: string }[];
    };

    // Validation
    if (!message?.trim()) {
      return NextResponse.json({ error: "رسالة فاضية" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    // Check awareness tokens (don't block if admin table not available)
    const admin = getSupabaseAdminClient();
    let tokensRemaining = 999;
    if (admin) {
      const { data: profile } = await admin
        .from("profiles")
        .select("awareness_tokens")
        .eq("id", userId)
        .maybeSingle();

      const currentTokens = Number(profile?.awareness_tokens ?? 0);
      if (currentTokens <= 0) {
        return NextResponse.json(
          { error: "لقد استنفدت طاقة رحلتك" },
          { status: 403 }
        );
      }
      tokensRemaining = currentTokens - 1;
    }

    // Initialize Gemini
    const genAI = getGeminiClient();
    if (!genAI) {
      return NextResponse.json(
        { error: "محرك الذكاء الاصطناعي غير متاح" },
        { status: 503 }
      );
    }

    // Build Life Advisor system prompt from context
    const systemPrompt = buildLifeAdvisorSystemPrompt(context);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.75,
        maxOutputTokens: 1024,
        topP: 0.9
      }
    });

    // Build chat history
    const history = [
      // Inject system prompt as first turn
      {
        role: "user" as const,
        parts: [{ text: `SYSTEM:\n${systemPrompt}` }]
      },
      {
        role: "model" as const,
        parts: [{ text: "مفهوم. أنا جارفيس، مستشارك الاستراتيجي. جاهز." }]
      },
      // Previous conversation
      ...conversationHistory.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }))
    ];

    const chat = model.startChat({ history });
    const llmStart = Date.now();
    const result = await chat.sendMessage(message);
    const latencyMs = Date.now() - llmStart;
    const reply = result.response.text();

    // Deduct token (fire-and-forget)
    if (admin) {
      // Fire-and-forget token consumption without blocking response path.
      void (async () => {
        try {
          await admin.rpc("consume_awareness_token", {
            p_user_id: userId,
            p_amount: 1
          });
        } catch {
          // non-blocking on purpose
        }
      })();
    }

    return NextResponse.json({
      reply,
      tokensRemaining,
      latencyMs
    });

  } catch (err) {
    const latencyMs = Date.now() - startTime;
    console.error("[Life Advisor] Error:", err);
    return NextResponse.json(
      {
        error: "حصل خطأ غير متوقع",
        latencyMs
      },
      { status: 500 }
    );
  }
}
