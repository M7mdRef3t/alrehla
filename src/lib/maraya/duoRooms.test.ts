import { describe, expect, it } from "vitest";
import {
  buildVoteUpdateForSession,
  serializeRoomForSession,
  type DuoRoomSnapshot,
} from "./duoRooms";

function createRoomSnapshot(): DuoRoomSnapshot {
  return {
    id: "ROOM42",
    host_profile_id: "profile_host",
    status: "active",
    story_started: true,
    current_scene_version: 2,
    current_emotion: "hope",
    output_mode: "judge_en",
    pending_vote: {
      sceneId: "scene_2",
      requiredVotes: 2,
      mismatch: false,
      choices: [
        { text_ar: "choice one", emotion_shift: "hope" },
        { text_ar: "choice two", emotion_shift: "wonder" },
      ],
      votes: [
        {
          sessionId: "host_session",
          name: "Host Mirror",
          sceneId: "scene_2",
          choiceIndex: 1,
          choiceText: "More cinema",
          emotionShift: "wonder",
          outputMode: "judge_en",
        },
        {
          sessionId: "guest_session",
          name: "Guest Mirror",
          sceneId: "scene_2",
          choiceIndex: 1,
          choiceText: "More cinema",
          emotionShift: "wonder",
          outputMode: "judge_en",
        },
      ],
    },
    room_state: {
      notice: "Both mirrors aligned.",
    },
    expires_at: null,
    created_at: "2026-03-19T00:00:00.000Z",
    updated_at: "2026-03-19T00:00:00.000Z",
    members: [
      {
        room_id: "ROOM42",
        profile_id: "profile_host",
        anon_id: "anon_host",
        session_id: "host_session",
        role: "host",
        display_name: "Host Mirror",
        connected: true,
        last_seen_at: "2026-03-19T00:00:00.000Z",
        created_at: "2026-03-19T00:00:00.000Z",
        updated_at: "2026-03-19T00:00:00.000Z",
      },
      {
        room_id: "ROOM42",
        profile_id: "profile_guest",
        anon_id: "anon_guest",
        session_id: "guest_session",
        role: "guest",
        display_name: "Guest Mirror",
        connected: true,
        last_seen_at: "2026-03-19T00:00:00.000Z",
        created_at: "2026-03-19T00:00:00.000Z",
        updated_at: "2026-03-19T00:00:00.000Z",
      },
    ],
  };
}

describe("maraya duoRooms", () => {
  it("serializes room state for the host session with partner context", () => {
    const room = createRoomSnapshot();

    const serialized = serializeRoomForSession(room, "host_session");

    expect(serialized.roomId).toBe("ROOM42");
    expect(serialized.role).toBe("host");
    expect(serialized.partnerName).toBe("Guest Mirror");
    expect(serialized.canStart).toBe(true);
    expect(serialized.storyStarted).toBe(true);
    expect(serialized.readyCount).toBe(2);
    expect(serialized.requiredVotes).toBe(2);
    expect(serialized.selectedChoiceIndex).toBe(1);
    expect(serialized.notice).toBe("Both mirrors aligned.");
    expect(serialized.members).toEqual([
      {
        sessionId: "host_session",
        name: "Host Mirror",
        isHost: true,
        connected: true,
      },
      {
        sessionId: "guest_session",
        name: "Guest Mirror",
        isHost: false,
        connected: true,
      },
    ]);
  });

  it("builds vote updates with self vote index and connected vote count", () => {
    const room = createRoomSnapshot();

    const update = buildVoteUpdateForSession(room, "guest_session");

    expect(update.sceneId).toBe("scene_2");
    expect(update.mismatch).toBe(false);
    expect(update.readyCount).toBe(2);
    expect(update.requiredVotes).toBe(2);
    expect(update.selfVoteIndex).toBe(1);
    expect(update.votes).toHaveLength(2);
    expect(update.votes[0]?.choiceText).toBe("More cinema");
  });
});
