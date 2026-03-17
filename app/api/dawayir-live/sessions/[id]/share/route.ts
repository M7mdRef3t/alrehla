import { NextRequest, NextResponse } from "next/server";
import { requireLiveAuth } from "../../../../../../src/modules/dawayir-live/server/auth";
import {
  createSharedArtifact,
  getSessionAccess,
  getSessionDetail,
} from "../../../../../../src/modules/dawayir-live/server/repository";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireLiveAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const access = await getSessionAccess(auth.client, id, auth.userId);
  if (!access || access.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const detail = await getSessionDetail(auth.client, id);
  const origin = new URL(req.url).origin;
  const share = await createSharedArtifact(auth.client, auth.userId, detail, origin);
  return NextResponse.json(share);
}
