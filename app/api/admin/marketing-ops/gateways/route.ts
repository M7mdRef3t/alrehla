import { NextRequest, NextResponse } from "next/server";
import { MarketingGatewayService } from "@/services/marketingGatewayService";
import { requireLiveAuth } from "@/modules/dawayir-live/server/auth";

export async function GET(req: NextRequest) {
    const auth = await requireLiveAuth(req);
    if ("status" in auth) {
        return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    try {
        const gateways = await MarketingGatewayService.getGateways();
        return NextResponse.json({ ok: true, gateways });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireLiveAuth(req);
    if ("status" in auth) {
        return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    try {
        const { id, status, energy_level, oracle_note, auto_ignition_enabled, action } = await req.json();

        if (action === 'recalibrate') {
            await MarketingGatewayService.recalibrate(id, oracle_note || "تمت إعادة معايرة المسار سيادياً.");
            return NextResponse.json({ ok: true, message: "Gateway recalibrated" });
        }

        if (action === 'sync') {
            const results = await MarketingGatewayService.syncRealSpend();
            return NextResponse.json({ ok: true, results });
        }

        await MarketingGatewayService.updateGateway(id, { 
            status, 
            energy_level, 
            oracle_note, 
            auto_ignition_enabled 
        });
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
