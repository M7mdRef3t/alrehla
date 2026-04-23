import { NextRequest, NextResponse } from "next/server";
import { geminiClient } from "@/services/geminiClient";
import { consciousnessService } from "@/services/consciousnessService";
import { logger } from "@/services/logger";
import { safeGetSession } from "@/services/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const { nodeId, context } = await req.json();

    if (!nodeId || !context) {
      return NextResponse.json({ error: "Missing nodeId or context" }, { status: 400 });
    }

    const session = await safeGetSession();
    const userId = session?.user?.id || null;

    logger.info(`[Background Job API] Starting analysis for node: ${nodeId}`);

    const prompt = `حلل العلاقة دي بعمق بناءً على السياق: ${context}. 
    طلع 3 نقاط فنية: (المشكلة، الشعور المخفي، المناورة المقترحة). 
    رد بـ JSON فقط: { "insights": "string" }`;

    const response = await geminiClient.generateJSON<{ insights: string }>(prompt);
    const insights = response?.insights || "تحليل متعذر حالياً.";

    await consciousnessService.saveMoment(
      userId,
      `Analysis for Node ${nodeId} [Context: ${context}]: ${insights}`,
      "note"
    );

    logger.info(`[Background Job API] Analysis complete for node: ${nodeId}`);

    return NextResponse.json({ success: true, insights });
  } catch (error) {
    logger.error("[Background Job API] Error during analysis:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
