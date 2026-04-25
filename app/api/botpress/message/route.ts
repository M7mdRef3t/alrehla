import { NextRequest, NextResponse } from "next/server";
import { BotpressService } from "@/services/botpressService";
import { safeGetSession } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    // Optional: add rate limiting or require user auth here
    const { user } = await safeGetSession();
    
    const payload = await req.json();

    if (!payload || !payload.text || !payload.userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await BotpressService.sendMessage({
      userId: payload.userId,
      conversationId: payload.conversationId,
      text: payload.text,
      metadata: payload.metadata,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Botpress API] Failed to send message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
