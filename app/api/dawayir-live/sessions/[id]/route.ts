import { NextRequest, NextResponse } from "next/server";
import { requireLiveAuth } from "../../../../../src/modules/dawayir-live/server/auth";
import { getSessionAccess, getSessionDetail } from "../../../../../src/modules/dawayir-live/server/repository";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireLiveAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const access = await getSessionAccess(auth.client, id, auth.userId);
  if (!access) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const detail = await getSessionDetail(auth.client, id);
  return NextResponse.json(detail);
}
