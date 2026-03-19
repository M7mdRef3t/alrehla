import type { SupabaseClient } from "@supabase/supabase-js";

export interface DuoChoice {
  text_ar: string;
  emotion_shift: string;
}

export interface DuoVote {
  sessionId: string;
  name: string;
  sceneId: string;
  choiceIndex: number;
  choiceText: string;
  emotionShift: string;
  outputMode: string;
}

export interface DuoPendingVote {
  sceneId: string;
  choices: DuoChoice[];
  votes: DuoVote[];
  requiredVotes: number;
  mismatch: boolean;
}

export interface DuoRoomState {
  conversationHistory?: unknown[];
  emotionHistory?: string[];
  journeyScenes?: unknown[];
  currentScene?: Record<string, unknown> | null;
  currentSceneImage?: {
    sceneId: string;
    image: string;
    mimeType: string;
  } | null;
  mirrorMemory?: unknown;
  whisperText?: string;
  whisperInterpretation?: unknown;
  spaceReading?: string;
  mythicReading?: string;
  storyMoments?: unknown[];
  transcript?: unknown[];
  endingMessage?: string;
  secretEndingKey?: string | null;
  notice?: string;
}

export interface DuoRoomMemberRow {
  room_id: string;
  profile_id: string | null;
  anon_id: string;
  session_id: string;
  role: "host" | "guest";
  display_name: string;
  connected: boolean;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface DuoRoomRow {
  id: string;
  host_profile_id: string | null;
  status: string;
  story_started: boolean;
  current_scene_version: number;
  current_emotion: string;
  output_mode: string;
  pending_vote: DuoPendingVote | null;
  room_state: DuoRoomState;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DuoRoomSnapshot extends DuoRoomRow {
  members: DuoRoomMemberRow[];
}

export interface SerializedDuoRoom {
  roomId: string;
  role: "solo" | "host" | "guest";
  status: "idle" | "waiting" | "ready" | "active" | "reconnecting";
  partnerName: string;
  members: Array<{
    sessionId: string;
    name: string;
    isHost: boolean;
    connected: boolean;
  }>;
  canStart: boolean;
  storyStarted: boolean;
  votes: DuoVote[];
  mismatch: boolean;
  readyCount: number;
  requiredVotes: number;
  selectedChoiceIndex: number | null;
  notice: string;
  error: string;
}

export interface VoteUpdatePayload {
  sceneId: string;
  votes: DuoVote[];
  mismatch: boolean;
  readyCount: number;
  requiredVotes: number;
}

const ROOM_MEMBER_LIMIT = 2;

function normalizeRoomId(value: string) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

function nextRequiredVotes(room: DuoRoomSnapshot) {
  return Math.min(Math.max(room.members.length, 1), ROOM_MEMBER_LIMIT);
}

function toPendingVote(value: unknown): DuoPendingVote | null {
  if (!value || typeof value !== "object") return null;
  const pending = value as Partial<DuoPendingVote>;
  return {
    sceneId: typeof pending.sceneId === "string" ? pending.sceneId : "",
    choices: Array.isArray(pending.choices)
      ? pending.choices
          .map((choice) => {
            if (!choice || typeof choice !== "object") return null;
            const current = choice as Partial<DuoChoice>;
            return {
              text_ar: String(current.text_ar || "").trim(),
              emotion_shift: String(current.emotion_shift || "hope").trim() || "hope",
            };
          })
          .filter(Boolean) as DuoChoice[]
      : [],
    votes: Array.isArray(pending.votes)
      ? pending.votes
          .map((vote) => {
            if (!vote || typeof vote !== "object") return null;
            const current = vote as Partial<DuoVote>;
            return {
              sessionId: String(current.sessionId || "").trim(),
              name: String(current.name || "").trim(),
              sceneId: String(current.sceneId || "").trim(),
              choiceIndex: Number(current.choiceIndex || 0),
              choiceText: String(current.choiceText || "").trim(),
              emotionShift: String(current.emotionShift || "hope").trim() || "hope",
              outputMode: String(current.outputMode || "judge_en").trim() || "judge_en",
            };
          })
          .filter(Boolean) as DuoVote[]
      : [],
    requiredVotes:
      Number.isFinite(Number(pending.requiredVotes)) && Number(pending.requiredVotes) > 0
        ? Number(pending.requiredVotes)
        : ROOM_MEMBER_LIMIT,
    mismatch: Boolean(pending.mismatch),
  };
}

function mapRoom(row: Record<string, unknown>): DuoRoomRow {
  return {
    id: String(row.id),
    host_profile_id: row.host_profile_id ? String(row.host_profile_id) : null,
    status: String(row.status || "waiting"),
    story_started: Boolean(row.story_started),
    current_scene_version: Number(row.current_scene_version || 0),
    current_emotion: String(row.current_emotion || "hope"),
    output_mode: String(row.output_mode || "judge_en"),
    pending_vote: toPendingVote(row.pending_vote),
    room_state:
      row.room_state && typeof row.room_state === "object"
        ? (row.room_state as DuoRoomState)
        : {},
    expires_at: row.expires_at ? String(row.expires_at) : null,
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString()),
  };
}

function mapMember(row: Record<string, unknown>): DuoRoomMemberRow {
  return {
    room_id: String(row.room_id),
    profile_id: row.profile_id ? String(row.profile_id) : null,
    anon_id: String(row.anon_id || ""),
    session_id: String(row.session_id),
    role: row.role === "guest" ? "guest" : "host",
    display_name: String(row.display_name || ""),
    connected: Boolean(row.connected),
    last_seen_at: String(row.last_seen_at || new Date().toISOString()),
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString()),
  };
}

async function listMembers(client: SupabaseClient, roomId: string) {
  const membersQuery = await client
    .from("maraya_duo_room_members")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  if (membersQuery.error) {
    throw new Error(membersQuery.error.message);
  }

  return (membersQuery.data || []).map((row) => mapMember(row as Record<string, unknown>));
}

export async function getRoomSnapshot(client: SupabaseClient, roomId: string) {
  const normalizedRoomId = normalizeRoomId(roomId);
  if (!normalizedRoomId) return null;

  const roomQuery = await client
    .from("maraya_duo_rooms")
    .select("*")
    .eq("id", normalizedRoomId)
    .maybeSingle();

  if (roomQuery.error) {
    throw new Error(roomQuery.error.message);
  }

  if (!roomQuery.data) return null;

  const room = mapRoom(roomQuery.data as Record<string, unknown>);
  const members = await listMembers(client, normalizedRoomId);
  return { ...room, members };
}

function buildRoomStatus(room: DuoRoomSnapshot, sessionId: string): SerializedDuoRoom["status"] {
  const connectedCount = room.members.filter((member) => member.connected).length;
  const disconnectedPartner = room.members.find(
    (member) => member.session_id !== sessionId && !member.connected,
  );

  if (room.story_started) {
    return disconnectedPartner ? "reconnecting" : "active";
  }

  if (connectedCount >= ROOM_MEMBER_LIMIT) {
    return "ready";
  }

  return room.members.length >= ROOM_MEMBER_LIMIT ? "reconnecting" : "waiting";
}

export function serializeRoomForSession(
  room: DuoRoomSnapshot | null,
  sessionId: string,
  error = "",
): SerializedDuoRoom {
  if (!room) {
    return {
      roomId: "",
      role: "solo",
      status: "idle",
      partnerName: "",
      members: [],
      canStart: false,
      storyStarted: false,
      votes: [],
      mismatch: false,
      readyCount: 0,
      requiredVotes: ROOM_MEMBER_LIMIT,
      selectedChoiceIndex: null,
      notice: "",
      error,
    };
  }

  const self = room.members.find((member) => member.session_id === sessionId);
  const votes = room.pending_vote?.votes || [];
  const selfVote = votes.find((vote) => vote.sessionId === sessionId) || null;
  const connectedVoteCount = votes.filter((vote) =>
    room.members.find((member) => member.session_id === vote.sessionId)?.connected !== false,
  ).length;

  return {
    roomId: room.id,
    role: self?.role || "solo",
    status: buildRoomStatus(room, sessionId),
    partnerName:
      room.members.find((member) => member.session_id !== sessionId)?.display_name || "",
    members: room.members.map((member) => ({
      sessionId: member.session_id,
      name: member.display_name,
      isHost: member.role === "host",
      connected: member.connected,
    })),
    canStart:
      self?.role === "host" &&
      room.members.filter((member) => member.connected).length >= ROOM_MEMBER_LIMIT,
    storyStarted: room.story_started,
    votes,
    mismatch: Boolean(room.pending_vote?.mismatch),
    readyCount: connectedVoteCount,
    requiredVotes: room.pending_vote?.requiredVotes || nextRequiredVotes(room),
    selectedChoiceIndex: selfVote?.choiceIndex ?? null,
    notice: typeof room.room_state?.notice === "string" ? room.room_state.notice : "",
    error,
  };
}

export function buildVoteUpdateForSession(room: DuoRoomSnapshot, sessionId: string) {
  const pendingVote = room.pending_vote;
  const votes = pendingVote?.votes || [];
  const selfVote = votes.find((vote) => vote.sessionId === sessionId) || null;

  return {
    sceneId: pendingVote?.sceneId || "",
    votes,
    mismatch: Boolean(pendingVote?.mismatch),
    readyCount: votes.filter((vote) =>
      room.members.find((member) => member.session_id === vote.sessionId)?.connected !== false,
    ).length,
    requiredVotes: pendingVote?.requiredVotes || nextRequiredVotes(room),
    selfVoteIndex: selfVote?.choiceIndex ?? null,
  };
}

async function generateRoomId(client: SupabaseClient) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const roomId = normalizeRoomId(Math.random().toString(36).slice(2, 8));
    const existing = await client
      .from("maraya_duo_rooms")
      .select("id")
      .eq("id", roomId)
      .maybeSingle();
    if (existing.error) {
      throw new Error(existing.error.message);
    }
    if (!existing.data) {
      return roomId;
    }
  }
  throw new Error("Unable to allocate duo room");
}

export async function createDuoRoom(
  client: SupabaseClient,
  params: {
    profileId: string;
    anonId: string;
    sessionId: string;
    displayName: string;
  },
) {
  const roomId = await generateRoomId(client);
  const now = new Date().toISOString();

  const roomInsert = await client.from("maraya_duo_rooms").insert({
    id: roomId,
    host_session_id: params.sessionId,
    host_profile_id: params.profileId,
    status: "waiting",
    story_started: false,
    current_scene_version: 0,
    current_emotion: "hope",
    output_mode: "judge_en",
    pending_vote: null,
    room_state: {},
    updated_at: now,
  });

  if (roomInsert.error) {
    throw new Error(roomInsert.error.message);
  }

  const memberInsert = await client.from("maraya_duo_room_members").insert({
    room_id: roomId,
    profile_id: params.profileId,
    anon_id: params.anonId,
    session_id: params.sessionId,
    role: "host",
    display_name: params.displayName,
    connected: true,
    last_seen_at: now,
    updated_at: now,
  });

  if (memberInsert.error) {
    throw new Error(memberInsert.error.message);
  }

  const room = await getRoomSnapshot(client, roomId);
  if (!room) {
    throw new Error("Unable to load created room.");
  }
  return room;
}

export async function joinDuoRoom(
  client: SupabaseClient,
  params: {
    roomId: string;
    profileId: string;
    anonId: string;
    sessionId: string;
    displayName: string;
  },
) {
  const room = await getRoomSnapshot(client, params.roomId);
  if (!room) {
    return { room: null, error: "Room not found." };
  }

  if (room.expires_at && Date.parse(room.expires_at) <= Date.now()) {
    await deleteRoom(client, room.id);
    return { room: null, error: "Room not found." };
  }

  if (room.story_started) {
    return { room: null, error: "This room is already in a live story." };
  }

  const existingMember = room.members.find(
    (member) =>
      member.session_id === params.sessionId || member.anon_id === params.anonId,
  );

  if (!existingMember && room.members.length >= ROOM_MEMBER_LIMIT) {
    return { room: null, error: "This duo room is full." };
  }

  const now = new Date().toISOString();

  if (existingMember) {
    const update = await client
      .from("maraya_duo_room_members")
      .update({
        profile_id: params.profileId,
        anon_id: params.anonId,
        session_id: params.sessionId,
        display_name: params.displayName,
        connected: true,
        last_seen_at: now,
        updated_at: now,
      })
      .eq("room_id", room.id)
      .eq("session_id", existingMember.session_id);

    if (update.error) {
      throw new Error(update.error.message);
    }
  } else {
    const insert = await client.from("maraya_duo_room_members").insert({
      room_id: room.id,
      profile_id: params.profileId,
      anon_id: params.anonId,
      session_id: params.sessionId,
      role: "guest",
      display_name: params.displayName,
      connected: true,
      last_seen_at: now,
      updated_at: now,
    });

    if (insert.error) {
      throw new Error(insert.error.message);
    }
  }

  const roomUpdate = await client
    .from("maraya_duo_rooms")
    .update({
      status: "ready",
      expires_at: null,
      updated_at: now,
    })
    .eq("id", room.id);

  if (roomUpdate.error) {
    throw new Error(roomUpdate.error.message);
  }

  return { room: await getRoomSnapshot(client, room.id), error: "" };
}

export async function deleteRoom(client: SupabaseClient, roomId: string) {
  const normalized = normalizeRoomId(roomId);
  if (!normalized) return;

  const deleteMembers = await client
    .from("maraya_duo_room_members")
    .delete()
    .eq("room_id", normalized);

  if (deleteMembers.error) {
    throw new Error(deleteMembers.error.message);
  }

  const deleteRoomQuery = await client
    .from("maraya_duo_rooms")
    .delete()
    .eq("id", normalized);

  if (deleteRoomQuery.error) {
    throw new Error(deleteRoomQuery.error.message);
  }
}

export async function leaveDuoRoom(
  client: SupabaseClient,
  roomId: string,
  sessionId: string,
) {
  const room = await getRoomSnapshot(client, roomId);
  if (!room) {
    return { room: null, closed: true, message: "The duo room is no longer available." };
  }

  const member = room.members.find((entry) => entry.session_id === sessionId);
  if (!member) {
    return { room, closed: false, message: "" };
  }

  if (member.role === "host" || room.members.length <= 1) {
    await deleteRoom(client, room.id);
    return { room: null, closed: true, message: "The host closed the duo room." };
  }

  const deleteMember = await client
    .from("maraya_duo_room_members")
    .delete()
    .eq("room_id", room.id)
    .eq("session_id", sessionId);

  if (deleteMember.error) {
    throw new Error(deleteMember.error.message);
  }

  const now = new Date().toISOString();
  const roomUpdate = await client
    .from("maraya_duo_rooms")
    .update({
      status: "waiting",
      story_started: false,
      pending_vote: null,
      expires_at: null,
      updated_at: now,
      room_state: {
        ...(room.room_state || {}),
        notice: "Your partner left the duo room.",
      },
    })
    .eq("id", room.id);

  if (roomUpdate.error) {
    throw new Error(roomUpdate.error.message);
  }

  return {
    room: await getRoomSnapshot(client, room.id),
    closed: false,
    message: "Your partner left the duo room.",
  };
}

export async function resetDuoRoom(client: SupabaseClient, roomId: string) {
  const room = await getRoomSnapshot(client, roomId);
  if (!room) return null;

  const update = await client
    .from("maraya_duo_rooms")
    .update({
      status:
        room.members.filter((member) => member.connected).length >= ROOM_MEMBER_LIMIT
          ? "ready"
          : "waiting",
      story_started: false,
      pending_vote: null,
      current_scene_version: 0,
      room_state: {},
      updated_at: new Date().toISOString(),
    })
    .eq("id", room.id);

  if (update.error) {
    throw new Error(update.error.message);
  }

  const nextRoom = await getRoomSnapshot(client, room.id);
  if (!nextRoom) {
    throw new Error("Unable to reload reset room.");
  }
  return nextRoom;
}

export async function saveDuoVote(
  client: SupabaseClient,
  params: {
    roomId: string;
    sessionId: string;
    sceneId: string;
    choiceIndex: number;
    choiceText: string;
    emotionShift: string;
    outputMode: string;
  },
) {
  const room = await getRoomSnapshot(client, params.roomId);
  if (!room) throw new Error("Room not found.");

  const member = room.members.find((entry) => entry.session_id === params.sessionId);
  if (!member) throw new Error("You are not part of this duo room.");

  const pendingVote = room.pending_vote || {
    sceneId: params.sceneId,
    choices:
      Array.isArray(room.room_state?.currentScene?.choices) &&
      room.room_state.currentScene.choices.length > 0
        ? (room.room_state.currentScene.choices as DuoChoice[])
        : [],
    votes: [],
    requiredVotes: nextRequiredVotes(room),
    mismatch: false,
  };

  const nextVotes = [
    ...pendingVote.votes.filter((vote) => vote.sessionId !== params.sessionId),
    {
      sessionId: params.sessionId,
      name: member.display_name,
      sceneId: params.sceneId,
      choiceIndex: params.choiceIndex,
      choiceText: params.choiceText,
      emotionShift: params.emotionShift,
      outputMode: params.outputMode,
    },
  ];

  const connectedVoters = nextVotes.filter((vote) =>
    room.members.find((entry) => entry.session_id === vote.sessionId)?.connected !== false,
  );
  const mismatch =
    connectedVoters.length >= pendingVote.requiredVotes &&
    new Set(connectedVoters.map((vote) => vote.choiceIndex)).size > 1;

  const nextPendingVote: DuoPendingVote = {
    ...pendingVote,
    sceneId: params.sceneId,
    votes: nextVotes,
    requiredVotes: pendingVote.requiredVotes || nextRequiredVotes(room),
    mismatch,
  };

  const update = await client
    .from("maraya_duo_rooms")
    .update({
      pending_vote: nextPendingVote,
      updated_at: new Date().toISOString(),
    })
    .eq("id", room.id);

  if (update.error) {
    throw new Error(update.error.message);
  }

  const nextRoom = await getRoomSnapshot(client, room.id);
  if (!nextRoom) {
    throw new Error("Unable to reload room vote state.");
  }
  return nextRoom;
}

export async function storeRoomState(
  client: SupabaseClient,
  params: {
    roomId: string;
    sceneVersion: number;
    currentEmotion: string;
    outputMode: string;
    storyStarted: boolean;
    roomState: DuoRoomState;
    pendingVote?: DuoPendingVote | null;
  },
) {
  const room = await getRoomSnapshot(client, params.roomId);
  if (!room) throw new Error("Room not found.");

  const update = await client
    .from("maraya_duo_rooms")
    .update({
      status: params.storyStarted
        ? "active"
        : room.members.filter((member) => member.connected).length >= ROOM_MEMBER_LIMIT
          ? "ready"
          : "waiting",
      story_started: params.storyStarted,
      current_scene_version: params.sceneVersion,
      current_emotion: params.currentEmotion || room.current_emotion,
      output_mode: params.outputMode || room.output_mode,
      pending_vote: params.pendingVote ?? room.pending_vote,
      room_state: params.roomState || {},
      updated_at: new Date().toISOString(),
    })
    .eq("id", room.id);

  if (update.error) {
    throw new Error(update.error.message);
  }

  const nextRoom = await getRoomSnapshot(client, room.id);
  if (!nextRoom) {
    throw new Error("Unable to reload room state.");
  }
  return nextRoom;
}

export async function restoreRoomForSession(
  client: SupabaseClient,
  params: {
    roomId?: string;
    sessionId: string;
    anonId?: string;
  },
) {
  let room: DuoRoomSnapshot | null = null;

  if (params.roomId) {
    room = await getRoomSnapshot(client, params.roomId);
  }

  if (!room) {
    const orFilters = [
      `session_id.eq.${params.sessionId}`,
      params.anonId ? `anon_id.eq.${params.anonId}` : "",
    ].filter(Boolean);

    const memberQuery = await client
      .from("maraya_duo_room_members")
      .select("room_id, session_id, anon_id")
      .or(orFilters.join(","))
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (memberQuery.error) {
      throw new Error(memberQuery.error.message);
    }

    if (memberQuery.data?.room_id) {
      room = await getRoomSnapshot(client, String(memberQuery.data.room_id));
    }
  }

  if (!room) return null;

  const member = room.members.find(
    (entry) =>
      entry.session_id === params.sessionId ||
      (params.anonId && entry.anon_id === params.anonId),
  );
  if (!member) return null;

  const update = await client
    .from("maraya_duo_room_members")
    .update({
      session_id: params.sessionId,
      connected: true,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("room_id", room.id)
    .eq("session_id", member.session_id);

  if (update.error) {
    throw new Error(update.error.message);
  }

  return getRoomSnapshot(client, room.id);
}
