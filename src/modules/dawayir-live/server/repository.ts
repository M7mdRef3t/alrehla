import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LiveAccessRole,
  LiveReplayFrameRecord,
  LiveSessionAccessRecord,
  LiveSessionArtifactRecord,
  LiveSessionDetail,
  LiveSessionEventRecord,
  LiveSessionRecord,
  LiveSessionSummary,
} from "../types";

const LIVE_SESSIONS = "live_sessions";
const LIVE_EVENTS = "live_session_events";
const LIVE_ARTIFACTS = "live_session_artifacts";
const LIVE_FRAMES = "live_replay_frames";
const LIVE_ACCESS = "live_session_access";

export const LIVE_STORAGE_BUCKET = "dawayir-live";

function ensure<T>(value: T | null | undefined, fallback: T): T {
  return value ?? fallback;
}

export async function createSession(
  client: SupabaseClient,
  userId: string,
  input: {
    title?: string | null;
    mode: string;
    language: string;
    entrySurface: string;
    goalContext?: Record<string, unknown> | null;
  },
) {
  const now = new Date().toISOString();
  const { data, error } = await client
    .from(LIVE_SESSIONS)
    .insert({
      owner_user_id: userId,
      title: input.title ?? null,
      mode: input.mode,
      language: input.language,
      entry_surface: input.entrySurface,
      goal_context: input.goalContext ?? {},
      status: "created",
      started_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create session");
  }

  await client.from(LIVE_ACCESS).upsert(
    {
      session_id: data.id,
      user_id: userId,
      access_role: "owner",
      invited_by: userId,
    },
    { onConflict: "session_id,user_id" },
  );

  return data as LiveSessionRecord;
}

export async function getSessionAccess(
  client: SupabaseClient,
  sessionId: string,
  userId: string,
): Promise<{ session: LiveSessionRecord; role: LiveAccessRole } | null> {
  const { data: session, error } = await client
    .from(LIVE_SESSIONS)
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !session) return null;
  if (session.owner_user_id === userId) {
    return { session: session as LiveSessionRecord, role: "owner" };
  }

  const { data: access } = await client
    .from(LIVE_ACCESS)
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!access) return null;
  return {
    session: session as LiveSessionRecord,
    role: access.access_role as LiveAccessRole,
  };
}

export async function listSessionsForUser(client: SupabaseClient, userId: string) {
  const { data: owned, error: ownedError } = await client
    .from(LIVE_SESSIONS)
    .select("*")
    .eq("owner_user_id", userId)
    .order("updated_at", { ascending: false });

  if (ownedError) throw new Error(ownedError.message);

  const { data: accessRows, error: accessError } = await client
    .from(LIVE_ACCESS)
    .select("session_id")
    .eq("user_id", userId);

  if (accessError) throw new Error(accessError.message);

  const extraIds = ensure(accessRows, [])
    .map((row) => row.session_id)
    .filter((id) => !ensure(owned, []).some((session) => session.id === id));

  if (extraIds.length === 0) {
    return ensure(owned, []) as LiveSessionRecord[];
  }

  const { data: shared, error: sharedError } = await client
    .from(LIVE_SESSIONS)
    .select("*")
    .in("id", extraIds)
    .order("updated_at", { ascending: false });

  if (sharedError) throw new Error(sharedError.message);
  return [...ensure(owned, []), ...ensure(shared, [])] as LiveSessionRecord[];
}

export async function listCoachSessions(client: SupabaseClient, userId: string) {
  const { data: accessRows, error } = await client
    .from(LIVE_ACCESS)
    .select("session_id")
    .eq("user_id", userId)
    .eq("access_role", "coach");

  if (error) throw new Error(error.message);
  const ids = ensure(accessRows, []).map((row) => row.session_id);
  if (ids.length === 0) return [];

  const { data: sessions, error: sessionsError } = await client
    .from(LIVE_SESSIONS)
    .select("*")
    .in("id", ids)
    .order("updated_at", { ascending: false });

  if (sessionsError) throw new Error(sessionsError.message);
  return ensure(sessions, []) as LiveSessionRecord[];
}

export async function getSessionDetail(client: SupabaseClient, sessionId: string) {
  const [{ data: session }, { data: events }, { data: artifacts }, { data: replayFrames }, { data: access }] =
    await Promise.all([
      client.from(LIVE_SESSIONS).select("*").eq("id", sessionId).single(),
      client.from(LIVE_EVENTS).select("*").eq("session_id", sessionId).order("seq", { ascending: true }),
      client
        .from(LIVE_ARTIFACTS)
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false }),
      client
        .from(LIVE_FRAMES)
        .select("*")
        .eq("session_id", sessionId)
        .order("seq", { ascending: true }),
      client.from(LIVE_ACCESS).select("*").eq("session_id", sessionId).order("created_at", { ascending: true }),
    ]);

  if (!session) {
    throw new Error("Session not found");
  }

  return {
    session: session as LiveSessionRecord,
    events: ensure(events, []) as LiveSessionEventRecord[],
    artifacts: ensure(artifacts, []) as LiveSessionArtifactRecord[],
    replayFrames: ensure(replayFrames, []) as LiveReplayFrameRecord[],
    access: ensure(access, []) as LiveSessionAccessRecord[],
  } satisfies LiveSessionDetail;
}

export async function appendSessionActivity(
  client: SupabaseClient,
  sessionId: string,
  payload: {
    events?: LiveSessionEventRecord[];
    replayFrames?: LiveReplayFrameRecord[];
    metrics?: Record<string, unknown> | null;
  },
) {
  if (payload.events?.length) {
    const { error } = await client.from(LIVE_EVENTS).insert(
      payload.events.map((event) => ({
        session_id: sessionId,
        seq: event.seq,
        event_type: event.event_type,
        actor: event.actor,
        payload: event.payload,
      })),
    );
    if (error) throw new Error(error.message);
  }

  if (payload.replayFrames?.length) {
    const { error } = await client.from(LIVE_FRAMES).insert(
      payload.replayFrames.map((frame) => ({
        session_id: sessionId,
        seq: frame.seq,
        frame: frame.frame,
      })),
    );
    if (error) throw new Error(error.message);
  }

  const { error: updateError } = await client
    .from(LIVE_SESSIONS)
    .update({
      metrics: payload.metrics ?? undefined,
      updated_at: new Date().toISOString(),
      status: "active",
    })
    .eq("id", sessionId);

  if (updateError) throw new Error(updateError.message);
}

export async function upsertArtifact(
  client: SupabaseClient,
  sessionId: string,
  artifact: {
    artifactType: string;
    title?: string | null;
    content?: Record<string, unknown> | null;
    storagePath?: string | null;
    metadata?: Record<string, unknown> | null;
    createdBy?: string | null;
  },
) {
  const { data, error } = await client
    .from(LIVE_ARTIFACTS)
    .upsert(
      {
        session_id: sessionId,
        artifact_type: artifact.artifactType,
        title: artifact.title ?? null,
        content: artifact.content ?? {},
        storage_path: artifact.storagePath ?? null,
        metadata: artifact.metadata ?? {},
        created_by: artifact.createdBy ?? null,
      },
      { onConflict: "session_id,artifact_type" },
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to save artifact");
  }

  return data as LiveSessionArtifactRecord;
}

export async function completeSession(
  client: SupabaseClient,
  sessionId: string,
  payload: {
    status?: string;
    summary: LiveSessionSummary;
    metrics: Record<string, unknown>;
  },
) {
  const { data, error } = await client
    .from(LIVE_SESSIONS)
    .update({
      status: payload.status ?? "completed",
      summary: payload.summary,
      metrics: payload.metrics,
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to complete session");
  }

  return data as LiveSessionRecord;
}

export async function grantSessionAccess(
  client: SupabaseClient,
  sessionId: string,
  userId: string,
  role: LiveAccessRole,
  invitedBy: string,
) {
  const { data, error } = await client
    .from(LIVE_ACCESS)
    .upsert(
      {
        session_id: sessionId,
        user_id: userId,
        access_role: role,
        invited_by: invitedBy,
      },
      { onConflict: "session_id,user_id" },
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to grant access");
  }

  return data as LiveSessionAccessRecord;
}

export async function createSharedArtifact(
  client: SupabaseClient,
  ownerUserId: string,
  detail: LiveSessionDetail,
  origin: string,
) {
  const truthContract = detail.artifacts.find((artifact) => artifact.artifact_type === "truth_contract");
  const sessionReport = detail.artifacts.find((artifact) => artifact.artifact_type === "session_report");
  const payload = {
    type: "dawayir_live_session",
    session_id: detail.session.id,
    session_title: detail.session.title,
    summary: detail.session.summary,
    truth_contract: truthContract?.content ?? null,
    report: sessionReport?.content ?? null,
    created_at: new Date().toISOString(),
  };

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);

  const { data, error } = await client
    .from("shared_artifacts")
    .insert({
      owner_user_id: ownerUserId,
      artifact_type: "dawayir_live_session",
      payload,
      expires_at: expiry.toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create share");
  }

  const artifact = await upsertArtifact(client, detail.session.id, {
    artifactType: "share_link",
    title: "Judge Share",
    content: { shareId: data.id, url: `${origin}/s/${data.id}` },
    createdBy: ownerUserId,
  });

  return {
    shareId: data.id as string,
    url: `${origin}/s/${data.id}`,
    artifact,
  };
}
