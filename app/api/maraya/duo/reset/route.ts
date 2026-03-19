import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../_lib/supabaseAdmin";
import { resetDuoRoom, serializeRoomForSession } from "@/lib/maraya/duoRooms";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const client = getSupabaseAdminClient();
  if (!client) {
    return NextResponse.json({ success: false, error: "Supabase admin client is not configured." }, { status: 500 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const roomId = String(body.roomId || "").trim();
    const sessionId = String(body.sessionId || "").trim();

    if (!roomId || !sessionId) {
      return NextResponse.json({ success: false, error: "roomId and sessionId are required." }, { status: 400 });
    }

    const room = await resetDuoRoom(client, roomId);
    return NextResponse.json({
      success: true,
      room: room ? serializeRoomForSession(room, sessionId) : null,
      roomState: room?.room_state || {},
      currentSceneVersion: room?.current_scene_version || 0,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
