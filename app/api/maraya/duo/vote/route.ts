import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../_lib/supabaseAdmin";
import { buildVoteUpdateForSession, saveDuoVote, serializeRoomForSession } from "@/lib/maraya/duoRooms";

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
    const sceneId = String(body.sceneId || "").trim();
    const choiceIndex = Number(body.choiceIndex || 0);
    const choiceText = String(body.choiceText || "").trim();
    const emotionShift = String(body.emotionShift || "hope").trim() || "hope";
    const outputMode = String(body.outputMode || "judge_en").trim() || "judge_en";

    if (!roomId || !sessionId || !sceneId || !choiceText) {
      return NextResponse.json({ success: false, error: "roomId, sessionId, sceneId and choiceText are required." }, { status: 400 });
    }

    const room = await saveDuoVote(client, {
      roomId,
      sessionId,
      sceneId,
      choiceIndex,
      choiceText,
      emotionShift,
      outputMode,
    });

    return NextResponse.json({
      success: true,
      room: serializeRoomForSession(room, sessionId),
      voteState: buildVoteUpdateForSession(room, sessionId),
      roomState: room.room_state || {},
      currentSceneVersion: room.current_scene_version || 0,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
