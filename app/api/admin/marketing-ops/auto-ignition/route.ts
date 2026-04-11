import { NextResponse } from "next/server";
import { MarketingAutomationService } from "@/services/marketingAutomationService";

import { logger } from "@/services/logger";

/**
 * Trigger Auto-Ignition Loop
 * POST /api/admin/marketing-ops/auto-ignition
 */
export async function POST(req: Request) {
    try {
        // Simple auth check via header (mirroring adminApi logic)
        const authHeader = req.headers.get("authorization") || "";
        const token = authHeader.replace("Bearer ", "");
        
        if (!token) {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        logger.info("📡 Manual Auto-Ignition trigger requested.");
        const actions = await MarketingAutomationService.processAutonomousDecisions();

        return NextResponse.json({
            ok: true,
            actionsCount: actions.length,
            actions: actions.map(a => ({ type: a.type, reason: a.reasoning }))
        });
    } catch (error: any) {
        logger.error("Auto-Ignition API Error:", error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
