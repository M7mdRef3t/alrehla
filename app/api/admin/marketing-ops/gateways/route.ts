import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MarketingGatewayService } from "@/services/marketingGatewayService";
import { requireLiveAuth } from "@/modules/dawayir-live/server/auth";

const gatewayPayloadSchema = z.object({
  id: z.enum(["meta", "tiktok", "google", "direct"]).optional(),
  status: z.enum(["open", "locked", "restricted"]).optional(),
  energy_level: z.number().min(0).max(100).optional(),
  oracle_note: z.string().max(2000).optional(),
  auto_ignition_enabled: z.boolean().optional(),
  action: z.enum(["recalibrate", "sync"]).optional(),
});

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
    const parsed = gatewayPayloadSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invalid_payload", details: parsed.error.flatten() }, { status: 400 });
    }
    const { id, status, energy_level, oracle_note, auto_ignition_enabled, action } = parsed.data;

    if (action === "recalibrate") {
      if (!id) {
        return NextResponse.json({ ok: false, error: "missing_gateway_id" }, { status: 400 });
      }
      await MarketingGatewayService.recalibrate(id, oracle_note || "تمت إعادة معايرة المسار سيادياً.");
      return NextResponse.json({ ok: true, message: "Gateway recalibrated" });
    }

    if (action === "sync") {
      const results = await MarketingGatewayService.syncRealSpend();
      return NextResponse.json({ ok: true, results });
    }

    if (!id) {
      return NextResponse.json({ ok: false, error: "missing_gateway_id" }, { status: 400 });
    }

    await MarketingGatewayService.updateGateway(id, {
      status,
      energy_level,
      oracle_note,
      auto_ignition_enabled,
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
