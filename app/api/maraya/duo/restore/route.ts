import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../_lib/supabaseAdmin";
import {
  restoreRoomForSession,
  serializeRoomForSession,
  storeRoomState,
  type DuoPendingVote,
  type DuoRoomState,
} from "@/lib/maraya/duoRooms";

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
    const anonId = String(body.anonId || "").trim();

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "sessionId is required." }, { status: 400 });
    }

    if (roomId && body.roomState && typeof body.roomState === "object") {
      const room = await storeRoomState(client, {
        roomId,
        sceneVersion: Number(body.sceneVersion || 0),
        currentEmotion: String(body.currentEmotion || "hope"),
        outputMode: String(body.outputMode || "judge_en"),
        storyStarted: Boolean(body.storyStarted),
        roomState: body.roomState as DuoRoomState,
        pendingVote: (body.pendingVote as DuoPendingVote | null | undefined) ?? null,
      });

      return NextResponse.json({
        success: true,
        room: serializeRoomForSession(room, sessionId),
        roomState: room.room_state || {},
        currentSceneVersion: room.current_scene_version || 0,
      });
    }

    const room = await restoreRoomForSession(client, { roomId, sessionId, anonId });
    return NextResponse.json({
      success: true,
      room: room ? serializeRoomForSession(room, sessionId) : null,
      roomState: room?.room_state || null,
      currentSceneVersion: room?.current_scene_version || 0,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
