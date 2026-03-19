import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../_lib/supabaseAdmin";
import { joinDuoRoom, serializeRoomForSession } from "@/lib/maraya/duoRooms";
import { getOrCreateMarayaProfile } from "@/lib/maraya/profiles";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const client = getSupabaseAdminClient();
  if (!client) {
    return NextResponse.json({ success: false, error: "Supabase admin client is not configured." }, { status: 500 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const roomId = String(body.roomId || "").trim();
    const anonId = String(body.anonId || "").trim();
    const sessionId = String(body.sessionId || "").trim();
    const displayName = String(body.displayName || "Mirror Guest").trim().slice(0, 32);

    if (!roomId || !anonId || !sessionId) {
      return NextResponse.json({ success: false, error: "roomId, anonId and sessionId are required." }, { status: 400 });
    }

    const profile = await getOrCreateMarayaProfile(client, anonId, displayName);
    const result = await joinDuoRoom(client, {
      roomId,
      profileId: profile.id,
      anonId,
      sessionId,
      displayName: profile.display_name || displayName,
    });

    if (!result.room) {
      return NextResponse.json({ success: false, error: result.error || "Unable to join room." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      room: serializeRoomForSession(result.room, sessionId),
      roomState: result.room.room_state || {},
      currentSceneVersion: result.room.current_scene_version || 0,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
