import { NextResponse } from "next/server";
import { requireLiveAuth } from "../../../../../src/modules/dawayir-live/server/auth";
import { revenueEngine } from "../../../../../src/ai/revenueAutomation";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireLiveAuth(req as any);
  if ("status" in auth) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const metrics = await revenueEngine.analyzeCurrentMetrics();
    
    if (!metrics) {
      return NextResponse.json({ ok: false, error: "failed_to_analyze_metrics" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, metrics });
  } catch (error: any) {
    console.error("[revenue/metrics] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
