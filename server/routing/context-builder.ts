import { clamp } from "./_shared";

export interface RoutingContextV2 {
  sessionId: string | null;
  userId: string | null;
  surface: "map" | "tools";
  phase: string;
  segmentKey: string;
  focusNodeId: string | null;
  riskRatio: number;
  pulseInstability7d: number;
  sessionHesitation: number;
  taskCompletion7d: number;
  recentTelemetry: {
    samples: number;
    avgHesitationSec: number;
    avgActiveSec: number;
  };
  cognitiveCapacity: number;
}

type RecentTelemetryInput = {
  hesitationSec?: number;
  activeElapsedSec?: number;
};

type RoutingFeaturesInput = {
  riskRatio?: unknown;
  pulseInstability7d?: unknown;
  sessionHesitation?: unknown;
  taskCompletion7d?: unknown;
  dominantRing?: unknown;
  focusNodeId?: unknown;
};

type RoutingBodyInput = {
  features?: RoutingFeaturesInput;
  recentTelemetry?: unknown;
  phase?: unknown;
  sessionId?: unknown;
  userId?: unknown;
  surface?: unknown;
};

export function buildRoutingContextV2(body: RoutingBodyInput): RoutingContextV2 {
  const features = body?.features ?? {};
  const riskRatio = clamp(Number(features?.riskRatio ?? 0), 0, 1);
  const pulseInstability7d = clamp(Number(features?.pulseInstability7d ?? 0), 0, 1);
  const sessionHesitation = clamp(Number(features?.sessionHesitation ?? 0), 0, 1);
  const taskCompletion7d = clamp(Number(features?.taskCompletion7d ?? 0), 0, 1);
  const recentTelemetryRaw = Array.isArray(body?.recentTelemetry)
    ? (body.recentTelemetry as RecentTelemetryInput[]).slice(-3)
    : [];
  const recentHesitations = recentTelemetryRaw
    .map((entry) => clamp(Number(entry?.hesitationSec ?? 0), 0, 600))
    .filter((value) => Number.isFinite(value));
  const recentActiveDurations = recentTelemetryRaw
    .map((entry) => clamp(Number(entry?.activeElapsedSec ?? 0), 0, 3600))
    .filter((value) => Number.isFinite(value));
  const avgRecentHesitationSec =
    recentHesitations.length > 0
      ? recentHesitations.reduce((sum, value) => sum + value, 0) / recentHesitations.length
      : 0;
  const avgRecentActiveSec =
    recentActiveDurations.length > 0
      ? recentActiveDurations.reduce((sum, value) => sum + value, 0) / recentActiveDurations.length
      : 0;
  const recentHesitationNorm = clamp(avgRecentHesitationSec / 20, 0, 1);
  const recentActiveNorm = clamp(avgRecentActiveSec / 180, 0, 1);
  const blendedHesitation = clamp(sessionHesitation * 0.75 + recentHesitationNorm * 0.25, 0, 1);
  const dominantRing = typeof features?.dominantRing === "string" ? features.dominantRing : "mixed";
  const phase = typeof body?.phase === "string" ? body.phase : "mapping";

  // In-memory context injection: recent telemetry refines cognitive pressure without DB reads.
  const cognitiveCapacity = clamp(
    1 - (blendedHesitation * 0.40 + pulseInstability7d * 0.30 + (1 - taskCompletion7d) * 0.20 + recentActiveNorm * 0.10),
    0,
    1
  );

  return {
    sessionId: typeof body?.sessionId === "string" ? body.sessionId : null,
    userId: typeof body?.userId === "string" ? body.userId : null,
    surface: body?.surface === "tools" ? "tools" : "map",
    phase,
    segmentKey: `${phase}:${dominantRing}`,
    focusNodeId: typeof features?.focusNodeId === "string" ? features.focusNodeId : null,
    riskRatio,
    pulseInstability7d,
    sessionHesitation: blendedHesitation,
    taskCompletion7d,
    recentTelemetry: {
      samples: recentTelemetryRaw.length,
      avgHesitationSec: Math.round(avgRecentHesitationSec * 100) / 100,
      avgActiveSec: Math.round(avgRecentActiveSec * 100) / 100
    },
    cognitiveCapacity
  };
}
