import { NextResponse } from "next/server";
import { telegramBot } from "@/services/telegramBot";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, severity, affectedFeatures } = body;

    if (!message || !severity || !affectedFeatures) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await telegramBot.alertCriticalError({
      message,
      severity,
      affectedFeatures,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send Telegram health alert:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
