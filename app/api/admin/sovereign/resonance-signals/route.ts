import { NextResponse, NextRequest } from "next/server";
import { ResonanceSignalService } from "@/services/ResonanceSignalService";
import { requireAdmin } from "@/server/requireAdmin";

export async function GET(req: NextRequest) {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    try {
        const [ghosting, pairings, stats] = await Promise.all([
            ResonanceSignalService.getGhostingAlerts(),
            ResonanceSignalService.getPairingSuggestions(),
            ResonanceSignalService.getGlobalStats()
        ]);

        return NextResponse.json({
            ok: true,
            data: {
                ghosting,
                pairings,
                stats
            }
        });
    } catch (error: any) {
        console.error("[Resonance Signals API] Failure:", error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
