import { NextResponse, NextRequest } from "next/server";
import { requireAdmin } from "@/server/requireAdmin";
import { revenueEngine } from "../../../../../src/ai/revenueAutomation";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

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
