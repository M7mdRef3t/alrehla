import { NextRequest, NextResponse } from "next/server";
import { requireLiveAuth } from "../../../../../src/modules/dawayir-live/server/auth";
import { listCoachSessions } from "../../../../../src/modules/dawayir-live/server/repository";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireLiveAuth(req);
  if (auth instanceof NextResponse) return auth;

  const sessions = await listCoachSessions(auth.client, auth.userId);
  return NextResponse.json({ sessions });
}
