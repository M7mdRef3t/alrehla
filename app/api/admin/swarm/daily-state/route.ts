import { NextResponse } from "next/server";
import { swarmOrchestrator } from "@/infrastructure/agents/swarmOrchestrator";

// Endpoint for Journey Agent generating the daily Wird
export async function POST(req: Request) {
  try {
    const { telemetry } = await req.json();

    if (!telemetry) {
      return NextResponse.json({ error: "Missing telemetry context" }, { status: 400 });
    }

    const payload = await swarmOrchestrator.generateDailyState(telemetry);

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[Swarm Daily API] Error:", error);
    return NextResponse.json({ error: "Failed to generate daily state" }, { status: 500 });
  }
}
