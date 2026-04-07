import { NextResponse } from "next/server";
import { telegramBot } from "@/services/telegramBot";
import type { HealthCheckResult } from "@/ai/autoHealthCheck";

export async function POST(req: Request) {
  try {
    const result = (await req.json()) as HealthCheckResult;

    if (!result || !result.status) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    const severity = result.status === "critical" ? "critical" : "high";
    const affectedFeatures = Array.from(
      new Set(result.issues?.map((issue) => issue.category) || [])
    );

    const message =
      `Health Score: ${result.score}/100\nIssues: ${result.issues?.length || 0}\nAuto-fixed: ${result.autoFixedIssues?.length || 0}\n\nTop issues:\n` +
      (result.issues?.slice(0, 3).map((i) => `- [${i.category}] ${i.description}`).join("\n") || "");

    await telegramBot.alertCriticalError({
      message,
      severity,
      affectedFeatures,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
