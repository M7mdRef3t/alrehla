import { NextRequest, NextResponse } from "next/server";
import { requireLiveAuth } from "../../../../../../src/modules/dawayir-live/server/auth";
import {
  getSessionAccess,
  grantSessionAccess,
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

  const body = (await req.json().catch(() => ({}))) as {
    role?: "partner" | "coach";
    userId?: string;
    email?: string;
  };

  let targetUserId = typeof body.userId === "string" ? body.userId : "";
  if (!targetUserId && typeof body.email === "string") {
    const { data } = await auth.client
      .from("profiles")
      .select("id,email")
      .ilike("email", body.email.trim())
      .maybeSingle();
    targetUserId = typeof data?.id === "string" ? data.id : "";
  }

  if (!targetUserId) {
    return NextResponse.json({ error: "Target user not found" }, { status: 404 });
  }

  const granted = await grantSessionAccess(
    auth.client,
    id,
    targetUserId,
    body.role === "coach" ? "coach" : "partner",
    auth.userId,
  );

  return NextResponse.json({ access: granted });
}
