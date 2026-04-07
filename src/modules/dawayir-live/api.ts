import { supabase } from "@/services/supabaseClient";
import type {
  BootstrapResponse,
  CognitiveMetrics,
  LiveAdminAnalytics,
  LiveReplayFrameRecord,
  LiveSessionAccessRecord,
  LiveSessionArtifactRecord,
  LiveSessionDetail,
  LiveSessionEventRecord,
  LiveSessionRecord,
  LiveSessionSummary,
  LoopRecall,
  ToolName,
  TruthContract,
} from "./types";

type JsonValue = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

async function getAccessToken(): Promise<string | null> {
  const session = await supabase?.auth.getSession();
  return session?.data?.session?.access_token ?? null;
}

async function liveFetch<T>(
  path: string,
  init?: RequestInit & { json?: JsonValue; requireAuth?: boolean },
): Promise<T> {
  const requireAuth = init?.requireAuth ?? true;
  const token = requireAuth ? await getAccessToken() : await getAccessToken().catch(() => null);
  if (requireAuth && !token) {
    throw new Error("AUTH_REQUIRED");
  }

  const response = await fetch(path, {
    method: init?.method ?? "GET",
    headers: {
      ...(init?.json ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    body: init?.json ? JSON.stringify(init.json) : init?.body,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(typeof payload.error === "string" ? payload.error : "LIVE_API_ERROR");
  }

  return payload as T;
}

export async function bootstrapLiveSession() {
  return liveFetch<BootstrapResponse>("/api/dawayir-live/bootstrap", {
    method: "POST",
    requireAuth: false,
  });
}

export async function createLiveSession(input: {
  title?: string | null;
  mode: string;
  language: string;
  entrySurface: string;
  goalContext?: Record<string, unknown> | null;
}) {
  return liveFetch<{ session: LiveSessionRecord }>("/api/dawayir-live/sessions", {
    method: "POST",
    json: input,
  });
}

export async function listLiveSessions() {
  return liveFetch<{ sessions: LiveSessionRecord[] }>("/api/dawayir-live/sessions");
}

export async function getLiveSession(sessionId: string) {
  return liveFetch<LiveSessionDetail>(`/api/dawayir-live/sessions/${sessionId}`);
}

export async function appendLiveEvents(
  sessionId: string,
  payload: {
    events?: LiveSessionEventRecord[];
    replayFrames?: LiveReplayFrameRecord[];
    metrics?: CognitiveMetrics | null;
  },
) {
  return liveFetch<{ ok: true }>(`/api/dawayir-live/sessions/${sessionId}/events`, {
    method: "POST",
    json: payload,
  });
}

export async function completeLiveSession(
  sessionId: string,
  payload: {
    metrics: CognitiveMetrics;
    snapshot: Record<string, unknown>;
    requestedSummary?: LiveSessionSummary | null;
  },
) {
  return liveFetch<{
    session: LiveSessionRecord;
    artifacts: LiveSessionArtifactRecord[];
    summary: LiveSessionSummary;
    truthContract: TruthContract;
    loopRecall: LoopRecall;
  }>(`/api/dawayir-live/sessions/${sessionId}/complete`, {
    method: "POST",
    json: payload,
  });
}

export async function runLiveTool(
  sessionId: string,
  name: ToolName,
  args: Record<string, unknown>,
) {
  return liveFetch<{
    result: Record<string, unknown>;
    artifact?: LiveSessionArtifactRecord | null;
    summary?: LiveSessionSummary | null;
    truthContract?: TruthContract | null;
    loopRecall?: LoopRecall | null;
  }>(`/api/dawayir-live/sessions/${sessionId}/tool`, {
    method: "POST",
    json: { name, args },
  });
}

export async function createLiveShare(sessionId: string) {
  return liveFetch<{ url: string; shareId: string }>(`/api/dawayir-live/sessions/${sessionId}/share`, {
    method: "POST",
  });
}

export async function grantLiveAccess(
  sessionId: string,
  payload: { role: "partner" | "coach"; userId?: string; email?: string },
) {
  return liveFetch<{ access: LiveSessionAccessRecord }>(`/api/dawayir-live/sessions/${sessionId}/access`, {
    method: "POST",
    json: payload,
  });
}

export async function listCoachLiveSessions() {
  return liveFetch<{ sessions: LiveSessionRecord[] }>("/api/dawayir-live/coach/sessions");
}

export async function getLiveAdminAnalytics() {
  return liveFetch<LiveAdminAnalytics>("/api/dawayir-live/admin/analytics");
}

export async function uploadLiveCameraCapture(
  sessionId: string,
  payload: { dataUrl: string; mimeType?: string; filename?: string; title?: string },
) {
  return liveFetch<{ artifact: LiveSessionArtifactRecord }>(`/api/dawayir-live/sessions/${sessionId}/camera`, {
    method: "POST",
    json: payload,
  });
}

export async function synthesizeLiveTts(
  sessionId: string,
  payload: { text: string; voice?: string; languageCode?: string },
) {
  return liveFetch<{ artifact?: LiveSessionArtifactRecord; audioContent?: string; configured: boolean }>(
    `/api/dawayir-live/sessions/${sessionId}/tts`,
    {
      method: "POST",
      json: payload,
    },
  );
}
