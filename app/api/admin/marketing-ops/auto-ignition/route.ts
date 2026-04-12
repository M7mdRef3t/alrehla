import { NextResponse } from "next/server";
import { MarketingAutomationService } from "@/services/marketingAutomationService";
import { isAdminLikeRole, requireLiveAuth } from "@/modules/dawayir-live/server/auth";
import { logger } from "@/services/logger";

/**
 * Trigger Auto-Ignition Loop
 * POST /api/admin/marketing-ops/auto-ignition
 */
export async function POST(req: Request) {
  try {
    const auth = await requireLiveAuth(req as any);
    if ("status" in auth) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    if (!isAdminLikeRole(auth.role)) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    logger.info("Manual Auto-Ignition trigger requested.", { userId: auth.userId });
    const actions = await MarketingAutomationService.processAutonomousDecisions();

    return NextResponse.json({
      ok: true,
      actionsCount: actions.length,
      actions: actions.map((a) => ({ type: a.type, reason: a.reasoning })),
    });
  } catch (error: any) {
    logger.error("Auto-Ignition API Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
