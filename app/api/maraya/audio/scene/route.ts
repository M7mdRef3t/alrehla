import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  return NextResponse.json({
    success: false,
    sceneId: typeof body.sceneId === "string" ? body.sceneId : null,
    reason: "Server narration export is not configured. Browser narration remains the primary path.",
    audio: null,
  });
}
