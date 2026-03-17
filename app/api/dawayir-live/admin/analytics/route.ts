import { NextRequest, NextResponse } from "next/server";
import { isAdminLikeRole, requireLiveAuth } from "../../../../../src/modules/dawayir-live/server/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireLiveAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!isAdminLikeRole(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    { data: sessions },
    { data: shares },
  ] = await Promise.all([
    auth.client.from("live_sessions").select("*").order("updated_at", { ascending: false }).limit(20),
    auth.client
      .from("shared_artifacts")
      .select("id")
      .eq("artifact_type", "dawayir_live_session"),
  ]);

  const safeSessions = sessions ?? [];
  const byModeMap = new Map<string, number>();
  const byStatusMap = new Map<string, number>();
  for (const session of safeSessions) {
    byModeMap.set(session.mode, (byModeMap.get(session.mode) ?? 0) + 1);
    byStatusMap.set(session.status, (byStatusMap.get(session.status) ?? 0) + 1);
  }

  return NextResponse.json({
    totalSessions: safeSessions.length,
    completedSessions: safeSessions.filter((session) => session.status === "completed").length,
    activeSessions: safeSessions.filter((session) => session.status === "active").length,
    sharedSessions: shares?.length ?? 0,
    byMode: Array.from(byModeMap.entries()).map(([mode, count]) => ({ mode, count })),
    byStatus: Array.from(byStatusMap.entries()).map(([status, count]) => ({ status, count })),
    recentSessions: safeSessions,
  });
}
