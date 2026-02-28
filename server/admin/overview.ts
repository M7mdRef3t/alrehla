import { sendEmail } from '../lib/email';
import { getAdminSupabase, parseJsonBody, recordAdminAudit, verifyAdmin, verifyAdminWithRoles } from "./_shared";
import { captureServerError, initServerMonitoring } from "./monitoring";
import type { SupabaseClient } from "@supabase/supabase-js";

type UserStateImportRow = {
  device_token?: string;
  owner_id?: string | null;
  data?: Record<string, unknown>;
  updated_at?: string;
};

const overviewRuntimeStats = {
  startedAt: Date.now(),
  requests: 0,
  errors: 0,
  lastErrorAt: 0,
  latencyMs: [] as number[]
};

type RequestLike = {
  query?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  method?: string;
  url?: string;
  body?: unknown;
};

type JsonResponder = {
  status: (code: number) => JsonResponder;
  json: (data: unknown) => JsonResponder;
  headersSent?: boolean;
};

function pushLatencySample(ms: number): void {
  overviewRuntimeStats.latencyMs.push(ms);
  if (overviewRuntimeStats.latencyMs.length > 200) overviewRuntimeStats.latencyMs.shift();
}

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return Math.round(sorted[index]);
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

type ConsciousRevenueSnapshot = {
  averageConsciousnessLevel: number;
  revenueSignal: number;
  alignmentScore: number;
  status: "strong" | "watch" | "critical";
  note: string;
};

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function computeConsciousRevenueSnapshot(input: {
  typeCounts: Record<string, number>;
  uniqueSessions: number;
  affiliateCtr: number;
  gate7Status: "ok" | "critical";
}): ConsciousRevenueSnapshot {
  const pathStarts = Number(input.typeCounts.path_started ?? 0);
  const taskCompleted = Number(input.typeCounts.task_completed ?? 0);
  const moodLogged = Number(input.typeCounts.mood_logged ?? 0);
  const sessions = Math.max(1, Number(input.uniqueSessions ?? 0));

  const taskPerSession = taskCompleted / sessions;
  const moodPerSession = moodLogged / sessions;
  const completionVsStarts = pathStarts > 0 ? taskCompleted / pathStarts : 0;
  const gatePenalty = input.gate7Status === "critical" ? 18 : 0;

  const averageConsciousnessLevel = clampPercent(
    taskPerSession * 32 + moodPerSession * 18 + completionVsStarts * 50 - gatePenalty
  );
  const revenueSignal = clampPercent(input.affiliateCtr * 8 + (input.gate7Status === "ok" ? 24 : 0));
  const alignmentScore = clampPercent(averageConsciousnessLevel * 0.7 + revenueSignal * 0.3);
  const status: ConsciousRevenueSnapshot["status"] =
    alignmentScore >= 70 ? "strong" : alignmentScore >= 45 ? "watch" : "critical";

  const note =
    status === "strong"
      ? "الوعي يتحول تلقائيا إلى عائد. استمر على نفس مسار الرحلة."
      : status === "watch"
        ? "العائد موجود لكن وعي الرحلة متوسط. زد خطوات الإكمال قبل أي دفع إعلاني."
        : "العائد غير مستقر لأن وعي الرحلة منخفض. أوقف التوسع التسويقي واصلح مسار الرحلة أولا.";

  return {
    averageConsciousnessLevel,
    revenueSignal,
    alignmentScore,
    status,
    note
  };
}

function safeLimit(raw: unknown, fallback: number, max = 5000): number {
  const value = Number(raw);
  if (Number.isNaN(value) || value <= 0) return fallback;
  return Math.min(value, max);
}

function normalizeReportPeriod(raw: unknown): "daily" | "weekly" | null {
  const value = String(raw ?? "").trim().toLowerCase();
  if (value === "daily" || value === "day") return "daily";
  if (value === "weekly" || value === "week") return "weekly";
  return null;
}

function getPositiveEnvInt(name: string, fallback: number): number {
  const raw = String(process.env[name] ?? "").trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.floor(value);
}

function normalizeWeeklyWindowDays(raw: unknown): 7 | 14 | 30 {
  const value = Number(raw);
  if (value === 14) return 14;
  if (value === 30) return 30;
  return 7;
}

function verifyCron(req: RequestLike): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const token = req.query?.secret || req.headers?.["x-cron-secret"];
  return token === secret;
}

async function sendSlack(message: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message })
  });
}


async function sendResend(subject: string, html: string): Promise<void> {
    const to = process.env.REPORT_EMAIL_TO;
    if (!to) return;
    await sendEmail(to, subject, html);
}

/** Default weights/thresholds — نفس منطق feelingScore (استنزاف = score > 2) */
const FEELING_WEIGHTS: Record<string, number> = { often: 3, sometimes: 2, rarely: 1, never: 0 };
const FEELING_DRAIN_THRESHOLD = 2; // score > 2 => شعور استنزاف

function feelingScore(answers: { q1?: string; q2?: string; q3?: string } | null): number {
  if (!answers) return 0;
  const pt = (q: string) => FEELING_WEIGHTS[q] ?? 0;
  return pt(String(answers.q1)) + pt(String(answers.q2)) + pt(String(answers.q3));
}

function computeAwarenessGap(maps: Array<{ session_id: string; nodes: unknown }>) {
  let totalGreen = 0;
  let gapCount = 0;
  const sessionsWithGap = new Set<string>();

  for (const row of maps) {
    const nodes = Array.isArray(row.nodes) ? row.nodes : [];
    for (const n of nodes) {
      const node = n as Record<string, unknown>;
      const ring = String(node.ring ?? "");
      if (ring !== "green") continue;
      totalGreen += 1;
      const analysis = node.analysis as Record<string, unknown> | null | undefined;
      const answers = analysis?.answers as { q1?: string; q2?: string; q3?: string } | null | undefined;
      const score = feelingScore(answers ?? null);
      if (score > FEELING_DRAIN_THRESHOLD) {
        gapCount += 1;
        sessionsWithGap.add(String(row.session_id ?? ""));
      }
    }
  }

  const gapPercent = totalGreen > 0 ? Math.round((gapCount / totalGreen) * 100) : 0;
  return { totalGreen, gapCount, gapPercent, usersWithGap: sessionsWithGap.size };
}

const SCENARIO_LABELS: Record<string, string> = {
  emergency: "طوارئ",
  emotional_prisoner: "سجين ذهني",
  active_battlefield: "استنزاف نشط",
  eggshells: "علاقة مشروطة",
  safe_harbor: "ميناء آمن",
  fading_echo: "صدى ذاهب"
};

function resolveScenario(node: Record<string, unknown>): string {
  const isEmergency = Boolean(node.isEmergency);
  if (isEmergency) return "emergency";

  const feel = node.analysis as Record<string, unknown> | null | undefined;
  const answers = feel?.answers as { q1?: string; q2?: string; q3?: string } | null | undefined;
  const symptomScore = feelingScore(answers ?? null);
  const reality = node.realityAnswers as { q1?: string; q2?: string; q3?: string } | null | undefined;
  const contactScore = feelingScore(reality ?? null);
  const safetyHigh = String(node.safetyAnswer ?? "") === "high";

  const lowMax = 2;
  const mediumMax = 5;
  const scoreLevel = (s: number) => (s > mediumMax ? "high" : s > lowMax ? "medium" : "low");
  const symptomLevel = answers?.q3 === "often" ? "high" : scoreLevel(symptomScore);
  const contactLevel = scoreLevel(contactScore);

  if (symptomLevel === "high" && contactLevel === "low") return "emotional_prisoner";
  if (symptomLevel === "high" && (contactLevel === "medium" || contactLevel === "high")) return "active_battlefield";
  if (symptomLevel === "medium") return "eggshells";
  if (symptomLevel === "low" && safetyHigh) return "safe_harbor";
  if (symptomLevel === "low" && contactLevel === "low") return "fading_echo";
  return "safe_harbor";
}

function computeTopScenarios(maps: Array<{ session_id: string; nodes: unknown }>) {
  const counts: Record<string, number> = {};
  for (const row of maps) {
    const nodes = Array.isArray(row.nodes) ? row.nodes : [];
    for (const n of nodes) {
      const node = n as Record<string, unknown>;
      const key = resolveScenario(node);
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return Object.entries(counts)
    .map(([key, count]) => ({
      key,
      label: SCENARIO_LABELS[key] ?? key,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

async function handleOverview(client: SupabaseClient, res: JsonResponder) {
  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const DAY_NAMES = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  const [
    { count: usersCount },
    { count: activeCount },
    { data: events },
    { count: aiLogsCount },
    { data: maps },
    { data: pulseLogs },
    { count: addedPeopleCount },
    { count: journeyMapsTotal },
    { count: pathStarted24h },
    { data: installedSessionsRows },
    { data: routingDecisionsV2 },
    { data: routingOutcomesV2 },
    { data: topSwarmEdgesRaw },
    { data: routingCacheRows },
    { data: routingOutcomeEvents },
    { data: routingInterventionEvents }
  ] = await Promise.all([
    client.from("profiles").select("id", { count: "exact", head: true }),
    client.from("journey_events").select("id", { count: "exact", head: true }).gte("created_at", fiveMinAgo),
    client
      .from("journey_events")
      .select("session_id,type,payload,created_at")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: true })
      .limit(1000),
    client.from("admin_ai_logs").select("id", { count: "exact", head: true }),
    client.from("journey_maps").select("session_id,nodes").limit(1000),
    client.from("daily_pulse_logs").select("energy,created_at").gte("created_at", thirtyDaysAgo).limit(2000),
    client.from("journey_events").select("id", { count: "exact", head: true }).eq("type", "node_added"),
    client.from("journey_maps").select("session_id", { count: "exact", head: true }),
    client.from("journey_events").select("id", { count: "exact", head: true }).eq("type", "path_started").gte("created_at", twentyFourHoursAgo),
    client
      .from("journey_events")
      .select("session_id")
      .eq("type", "flow_event")
      .contains("payload", { step: "install_clicked" })
      .not("session_id", "is", null)
      .limit(5000),
    client
      .from("routing_decisions_v2")
      .select("id,is_exploration,source,segment_key,context,chosen_step,created_at")
      .gte("created_at", thirtyDaysAgo)
      .limit(5000),
    client
      .from("routing_outcomes_v2")
      .select("id,decision_id,acted,completed,reported_at")
      .gte("reported_at", thirtyDaysAgo)
      .limit(5000),
    client
      .from("swarm_edge_stats")
      .select("edge_id,segment_key,trials,successes,avg_completion,decay_factor,last_updated")
      .order("last_updated", { ascending: false })
      .limit(50),
    client
      .from("routing_candidate_cache")
      .select("segment_key")
      .gt("expires_at", now.toISOString())
      .limit(10000),
    client
      .from("routing_events")
      .select("payload,created_at")
      .eq("event_type", "outcome_reported")
      .gte("created_at", thirtyDaysAgo)
      .limit(5000),
    client
      .from("routing_events")
      .select("payload,created_at")
      .eq("event_type", "intervention_triggered")
      .gte("created_at", thirtyDaysAgo)
      .limit(5000)
  ]);
  const installedUsers = new Set(
    ((installedSessionsRows ?? []) as Array<{ session_id?: unknown }>)
      .map((row) => String(row.session_id ?? "").trim())
      .filter(Boolean)
  ).size;

  const energyByDay = new Map<number, { total: number; count: number }>();
  for (const row of (pulseLogs ?? []) as Array<{ energy?: number; created_at?: string }>) {
    const energy = Number(row.energy);
    if (Number.isNaN(energy) || energy < 1 || energy > 10) continue;
    const day = new Date(String(row.created_at ?? "")).getDay();
    const cur = energyByDay.get(day) ?? { total: 0, count: 0 };
    cur.total += energy;
    cur.count += 1;
    energyByDay.set(day, cur);
  }
  const weeklyRhythmByDay = [0, 1, 2, 3, 4, 5, 6].map((day) => {
    const b = energyByDay.get(day) ?? { total: 0, count: 0 };
    return {
      day,
      dayName: DAY_NAMES[day],
      avg: b.count > 0 ? Math.round((b.total / b.count) * 10) / 10 : null,
      count: b.count
    };
  });
  let lowestDay = -1;
  let lowestAvg = Infinity;
  energyByDay.forEach((b, day) => {
    const avg = b.total / b.count;
    if (avg < lowestAvg) {
      lowestAvg = avg;
      lowestDay = day;
    }
  });
  const weeklyRhythm = {
    byDay: weeklyRhythmByDay,
    lowestDay,
    lowestDayName: lowestDay >= 0 ? DAY_NAMES[lowestDay] : null
  };

  const decisionsV2 = (routingDecisionsV2 ?? []) as Array<Record<string, unknown>>;
  const outcomesV2 = (routingOutcomesV2 ?? []) as Array<Record<string, unknown>>;
  const topSwarmEdges = (topSwarmEdgesRaw ?? []) as Array<Record<string, unknown>>;
  const explorationCount = decisionsV2.filter((d) => Boolean(d.is_exploration)).length;
  const exploitationCount = Math.max(0, decisionsV2.length - explorationCount);
  const explorationRate =
    decisionsV2.length > 0 ? Math.round((explorationCount / decisionsV2.length) * 10000) / 100 : null;
  const completionRate =
    outcomesV2.length > 0
      ? Math.round(
          (outcomesV2.filter((o) => Boolean(o.completed)).length / outcomesV2.length) * 10000
        ) / 100
      : null;
  const completionRateActedOnly =
    outcomesV2.length > 0
      ? (() => {
          const acted = outcomesV2.filter((o) => Boolean(o.acted));
          if (acted.length === 0) return null;
          return Math.round((acted.filter((o) => Boolean(o.completed)).length / acted.length) * 10000) / 100;
        })()
      : null;
  let noiseSampleCount = 0;
  let rawElapsedSum = 0;
  let activeElapsedSum = 0;
  let idleElapsedSum = 0;
  let hesitationSum = 0;
  for (const row of (routingOutcomeEvents ?? []) as Array<Record<string, unknown>>) {
    const payload = (row.payload ?? null) as Record<string, unknown> | null;
    const telemetry = (payload?.telemetry ?? null) as Record<string, unknown> | null;
    if (!telemetry) continue;
    const raw = Number(telemetry.rawElapsedSec);
    const active = Number(telemetry.completionLatencySec);
    if (!Number.isFinite(raw) || !Number.isFinite(active)) continue;
    noiseSampleCount += 1;
    rawElapsedSum += raw;
    activeElapsedSum += active;
    const idle = Number(telemetry.idleTimeSec);
    if (Number.isFinite(idle)) idleElapsedSum += idle;
    const hesitation = Number(telemetry.hesitationSec);
    if (Number.isFinite(hesitation)) hesitationSum += hesitation;
  }
  const avgRawElapsedSec = noiseSampleCount > 0 ? Math.round((rawElapsedSum / noiseSampleCount) * 100) / 100 : null;
  const avgActiveElapsedSec =
    noiseSampleCount > 0 ? Math.round((activeElapsedSum / noiseSampleCount) * 100) / 100 : null;
  const avgIdleElapsedSec = noiseSampleCount > 0 ? Math.round((idleElapsedSum / noiseSampleCount) * 100) / 100 : null;
  const avgHesitationSec = noiseSampleCount > 0 ? Math.round((hesitationSum / noiseSampleCount) * 100) / 100 : null;
  const noiseFilteredPct =
    noiseSampleCount > 0 && rawElapsedSum > 0
      ? Math.round((((rawElapsedSum - activeElapsedSum) / rawElapsedSum) * 100) * 100) / 100
      : null;
  const outcomesByDecisionId = new Map<string, Record<string, unknown>>();
  for (const outcome of outcomesV2) {
    outcomesByDecisionId.set(String(outcome.decision_id ?? ""), outcome);
  }
  const fallbackSources = new Set(["template_fallback", "local_policy"]);
  const v2Source = "cloud_ranker_v2";
  const fallbackDecisions = decisionsV2.filter((d) => fallbackSources.has(String(d.source ?? ""))).length;
  const v2Decisions = decisionsV2.filter((d) => String(d.source ?? "") === v2Source).length;
  const fallbackRatePct =
    decisionsV2.length > 0 ? Math.round((fallbackDecisions / decisionsV2.length) * 10000) / 100 : null;

  const explorationDecisionsRows = decisionsV2.filter((d) => Boolean(d.is_exploration));
  const exploitationDecisionsRows = decisionsV2.filter((d) => !d.is_exploration);
  const completionRateForDecisionRows = (rows: Array<Record<string, unknown>>): number | null => {
    if (rows.length === 0) return null;
    let completed = 0;
    for (const row of rows) {
      const outcome = outcomesByDecisionId.get(String(row.id ?? ""));
      if (outcome && Boolean(outcome.completed)) completed += 1;
    }
    return Math.round((completed / rows.length) * 10000) / 100;
  };

  const decisionsBySegment = new Map<string, number>();
  for (const row of decisionsV2) {
    const segmentKey = String(row.segment_key ?? "default");
    decisionsBySegment.set(segmentKey, (decisionsBySegment.get(segmentKey) ?? 0) + 1);
  }
  const cacheBySegment = new Map<string, number>();
  for (const row of (routingCacheRows ?? []) as Array<Record<string, unknown>>) {
    const segmentKey = String(row.segment_key ?? "default");
    cacheBySegment.set(segmentKey, (cacheBySegment.get(segmentKey) ?? 0) + 1);
  }
  const allSegmentKeys = new Set<string>([...decisionsBySegment.keys(), ...cacheBySegment.keys()]);
  const segmentCoverage = Array.from(allSegmentKeys)
    .map((segmentKey) => ({
      segmentKey,
      decisions24h: decisionsBySegment.get(segmentKey) ?? 0,
      activeCachedCandidates: cacheBySegment.get(segmentKey) ?? 0
    }))
    .sort((a, b) => b.decisions24h - a.decisions24h || a.activeCachedCandidates - b.activeCachedCandidates)
    .slice(0, 20);
  const interventionBySegment = new Map<string, number>();
  for (const row of (routingInterventionEvents ?? []) as Array<Record<string, unknown>>) {
    const payload = (row.payload ?? null) as Record<string, unknown> | null;
    const segmentKey = String(payload?.segmentKey ?? "unknown");
    interventionBySegment.set(segmentKey, (interventionBySegment.get(segmentKey) ?? 0) + 1);
  }
  const totalInterventions = Array.from(interventionBySegment.values()).reduce((sum, value) => sum + value, 0);
  const interventionRatePct =
    decisionsV2.length > 0 ? Math.round((totalInterventions / decisionsV2.length) * 10000) / 100 : null;
  const interventionSegmentKeys = new Set<string>([...allSegmentKeys, ...interventionBySegment.keys()]);
  const interventionBySegmentRows = Array.from(interventionSegmentKeys)
    .map((segmentKey) => {
      const interventions = interventionBySegment.get(segmentKey) ?? 0;
      const decisions = decisionsBySegment.get(segmentKey) ?? 0;
      return {
        segmentKey,
        interventions,
        decisions,
        interventionRatePct: decisions > 0 ? Math.round((interventions / decisions) * 10000) / 100 : null
      };
    })
    .sort((a, b) => b.interventions - a.interventions || b.decisions - a.decisions)
    .slice(0, 20);

  const contentIds = new Set<string>();
  for (const row of decisionsV2) {
    const chosenStep = (row.chosen_step ?? null) as Record<string, unknown> | null;
    const actionPayload = (chosenStep?.actionPayload ?? null) as Record<string, unknown> | null;
    const contentId = String(actionPayload?.contentId ?? "").trim();
    if (contentId) contentIds.add(contentId);
  }
  const contentMetaById = new Map<string, { cognitiveLoadRequired: number | null; estimatedMinutes: number | null }>();
  if (contentIds.size > 0) {
    const { data: contentMetaRows } = await client
      .from("content_items")
      .select("id,cognitive_load_required,estimated_minutes")
      .in("id", Array.from(contentIds));
    for (const row of (contentMetaRows ?? []) as Array<Record<string, unknown>>) {
      contentMetaById.set(String(row.id ?? ""), {
        cognitiveLoadRequired: row.cognitive_load_required == null ? null : Number(row.cognitive_load_required),
        estimatedMinutes: row.estimated_minutes == null ? null : Number(row.estimated_minutes)
      });
    }
  }
  type CapacityBand = "unknown" | "low_capacity" | "mid_capacity" | "high_capacity";
  type LoadBand = "unknown_load" | "low_load" | "mid_load" | "high_load";
  const capacityBandOf = (value: number | null): CapacityBand => {
    if (value == null || Number.isNaN(value)) return "unknown";
    if (value < 0.35) return "low_capacity";
    if (value < 0.65) return "mid_capacity";
    return "high_capacity";
  };
  const loadBandOf = (value: number | null): LoadBand => {
    if (value == null || Number.isNaN(value)) return "unknown_load";
    if (value <= 2) return "low_load";
    if (value === 3) return "mid_load";
    return "high_load";
  };
  const capacityStats = new Map<CapacityBand, { decisions: number; loadSum: number; loadCount: number; minutesSum: number; minutesCount: number }>();
  const completionMatrix = new Map<string, { capacityBand: CapacityBand; selectedLoadBand: LoadBand; decisions: number; completedCount: number }>();
  for (const decision of decisionsV2) {
    const context = (decision.context ?? null) as Record<string, unknown> | null;
    const cognitiveCapacityRaw = context?.cognitiveCapacity;
    const cognitiveCapacity =
      typeof cognitiveCapacityRaw === "number"
        ? cognitiveCapacityRaw
        : cognitiveCapacityRaw == null
          ? null
          : Number(cognitiveCapacityRaw);
    const capacityBand = capacityBandOf(cognitiveCapacity);
    const chosenStep = (decision.chosen_step ?? null) as Record<string, unknown> | null;
    const actionPayload = (chosenStep?.actionPayload ?? null) as Record<string, unknown> | null;
    const contentId = String(actionPayload?.contentId ?? "");
    const meta = contentMetaById.get(contentId) ?? { cognitiveLoadRequired: null, estimatedMinutes: null };
    const aggregate = capacityStats.get(capacityBand) ?? {
      decisions: 0,
      loadSum: 0,
      loadCount: 0,
      minutesSum: 0,
      minutesCount: 0
    };
    aggregate.decisions += 1;
    if (meta.cognitiveLoadRequired != null) {
      aggregate.loadSum += meta.cognitiveLoadRequired;
      aggregate.loadCount += 1;
    }
    if (meta.estimatedMinutes != null) {
      aggregate.minutesSum += meta.estimatedMinutes;
      aggregate.minutesCount += 1;
    }
    capacityStats.set(capacityBand, aggregate);

    const selectedLoadBand = loadBandOf(meta.cognitiveLoadRequired);
    const matrixKey = `${capacityBand}::${selectedLoadBand}`;
    const matrixRow = completionMatrix.get(matrixKey) ?? {
      capacityBand,
      selectedLoadBand,
      decisions: 0,
      completedCount: 0
    };
    matrixRow.decisions += 1;
    const outcome = outcomesByDecisionId.get(String(decision.id ?? ""));
    if (outcome && Boolean(outcome.completed)) matrixRow.completedCount += 1;
    completionMatrix.set(matrixKey, matrixRow);
  }
  const capacityOrder: CapacityBand[] = ["unknown", "low_capacity", "mid_capacity", "high_capacity"];
  const loadOrder: LoadBand[] = ["unknown_load", "low_load", "mid_load", "high_load"];
  const byCapacityBand = capacityOrder
    .map((capacityBand) => {
      const item = capacityStats.get(capacityBand);
      if (!item) return null;
      return {
        capacityBand,
        decisions: item.decisions,
        avgSelectedCognitiveLoad: item.loadCount > 0 ? Math.round((item.loadSum / item.loadCount) * 100) / 100 : null,
        avgSelectedMinutes: item.minutesCount > 0 ? Math.round((item.minutesSum / item.minutesCount) * 100) / 100 : null
      };
    })
    .filter(Boolean);
  const completionMatrixRows = Array.from(completionMatrix.values())
    .sort(
      (a, b) =>
        capacityOrder.indexOf(a.capacityBand) - capacityOrder.indexOf(b.capacityBand) ||
        loadOrder.indexOf(a.selectedLoadBand) - loadOrder.indexOf(b.selectedLoadBand)
    )
    .map((item) => ({
      capacityBand: item.capacityBand,
      selectedLoadBand: item.selectedLoadBand,
      decisions: item.decisions,
      completedCount: item.completedCount,
      completionRatePct: item.decisions > 0 ? Math.round((item.completedCount / item.decisions) * 10000) / 100 : null
    }));

  if (!events) {
    const awarenessGap = maps?.length ? computeAwarenessGap(maps as Array<{ session_id: string; nodes: unknown }>) : null;
    const topScenarios = maps?.length ? computeTopScenarios(maps as Array<{ session_id: string; nodes: unknown }>) : [];
    res.status(200).json({
      totalUsers: usersCount ?? null,
      activeNow: activeCount ?? null,
      avgMood: null,
      aiTokensUsed: aiLogsCount ?? null,
      growthData: [],
      zones: [],
      phaseOneGoal: {
        registeredUsers: usersCount ?? 0,
        installedUsers,
        addedPeople: addedPeopleCount ?? 0
      },
      awarenessGap: awarenessGap ?? undefined,
      funnel: { steps: [] },
      topScenarios,
      emergencyLogs: [],
      taskFriction: [],
      weeklyRhythm,
      flowStats: {
        byStep: {},
        avgTimeToActionMs: null,
        addPersonCompletionRate: null,
        pulseAbandonedByReason: {}
      },
      conversionHealth: {
        pathStarted24h: pathStarted24h ?? 0,
        journeyMapsTotal: journeyMapsTotal ?? 0,
        addPersonOpened: 0,
        addPersonDoneShowOnMap: 0
      },
      routingV2: {
        decisions: decisionsV2.length,
        outcomes: outcomesV2.length,
        explorationCount,
        exploitationCount,
        explorationRate,
        completionRate,
        completionRateActedOnly,
        topSwarmEdges: topSwarmEdges.slice(0, 10).map((row) => ({
          edgeId: String(row.edge_id ?? ""),
          segmentKey: String(row.segment_key ?? ""),
          trials: Number(row.trials ?? 0),
          successes: Number(row.successes ?? 0),
          avgCompletion: Number(row.avg_completion ?? 0),
          decayFactor: Number(row.decay_factor ?? 1)
        }))
      },
      routingTelemetry: {
        cacheHealth: {
          totalDecisions: decisionsV2.length,
          v2Decisions,
          fallbackDecisions,
          fallbackRatePct
        },
        explorationHealth: {
          explorationDecisions: explorationDecisionsRows.length,
          exploitationDecisions: exploitationDecisionsRows.length,
          explorationSharePct:
            decisionsV2.length > 0 ? Math.round((explorationDecisionsRows.length / decisionsV2.length) * 10000) / 100 : null,
          explorationCompletionRatePct: completionRateForDecisionRows(explorationDecisionsRows),
          exploitationCompletionRatePct: completionRateForDecisionRows(exploitationDecisionsRows)
        },
        cognitiveEffectiveness: {
          byCapacityBand,
          completionMatrix: completionMatrixRows
        },
        segmentCoverage,
        latencyQuality: {
          sampleCount: noiseSampleCount,
          avgRawElapsedSec,
          avgActiveElapsedSec,
          avgIdleElapsedSec,
          avgHesitationSec,
          noiseFilteredPct
        },
        interventionHealth: {
          totalInterventions,
          interventionRatePct,
          bySegment: interventionBySegmentRows
        }
      }
    });
    return;
  }

  const growthMap = new Map<string, { paths: number; nodes: number }>();
  const zoneMap = new Map<string, number>();
  let moodSum = 0;
  let moodCount = 0;

  for (const row of events as Array<Record<string, unknown>>) {
    const createdAt = String(row.created_at ?? "");
    const date = createdAt ? createdAt.slice(5, 10) : "--";
    if (!growthMap.has(date)) growthMap.set(date, { paths: 0, nodes: 0 });
    const bucket = growthMap.get(date)!;
    const type = String(row.type ?? "");
    const payload = row.payload as Record<string, unknown> | null;
    if (type === "path_started") bucket.paths += 1;
    if (type === "node_added") bucket.nodes += 1;
    if (payload?.moodScore != null) {
      moodSum += Number(payload.moodScore);
      moodCount += 1;
    }
    if (payload?.zone) {
      const zone = String(payload.zone);
      zoneMap.set(zone, (zoneMap.get(zone) ?? 0) + 1);
    }
  }

  const growthData = Array.from(growthMap.entries()).map(([date, value]) => ({
    date,
    paths: value.paths,
    nodes: value.nodes
  }));
  const zones = Array.from(zoneMap.entries()).map(([label, count]) => ({ label, count }));

  const awarenessGap = maps?.length ? computeAwarenessGap(maps as Array<{ session_id: string; nodes: unknown }>) : null;
  const topScenarios = maps?.length ? computeTopScenarios(maps as Array<{ session_id: string; nodes: unknown }>) : [];

  const sessionsByType = {
    node_added: new Set<string>(),
    path_started: new Set<string>(),
    task_completed: new Set<string>()
  };
  for (const row of events as Array<Record<string, unknown>>) {
    const sid = String(row.session_id ?? "anonymous");
    const type = String(row.type ?? "");
    if (type === "node_added") sessionsByType.node_added.add(sid);
    if (type === "path_started") sessionsByType.path_started.add(sid);
    if (type === "task_completed") sessionsByType.task_completed.add(sid);
  }
  const funnel = {
    steps: [
      { label: "أضاف شخصاً", count: sessionsByType.node_added.size, key: "identification" },
      { label: "بدأ مساراً", count: sessionsByType.path_started.size, key: "commitment" },
      { label: "نفّذ مهمة", count: sessionsByType.task_completed.size, key: "success" }
    ]
  };

  const emergencyLogs = (events as Array<Record<string, unknown>>)
    .filter((row) => String(row.type ?? "") === "node_added" && (row.payload as Record<string, unknown>)?.isEmergency === true)
    .map((row) => ({
      sessionId: String(row.session_id ?? ""),
      personLabel: String((row.payload as Record<string, unknown>)?.personLabel ?? "—"),
      createdAt: String(row.created_at ?? "")
    }))
    .slice(-5)
    .reverse();

  const taskByLabel = new Map<string, { started: number; completed: number }>();
  for (const row of events as Array<Record<string, unknown>>) {
    const type = String(row.type ?? "");
    const p = row.payload as Record<string, unknown> | null;
    const label = String(p?.taskLabel ?? (p?.taskId ?? ""));
    if (!label) continue;
    if (!taskByLabel.has(label)) taskByLabel.set(label, { started: 0, completed: 0 });
    const bucket = taskByLabel.get(label)!;
    if (type === "task_started") bucket.started += 1;
    if (type === "task_completed") bucket.completed += 1;
  }
  const taskFriction = Array.from(taskByLabel.entries())
    .filter(([, b]) => b.started > 0)
    .map(([label, b]) => ({
      label,
      started: b.started,
      completed: b.completed,
      escapeRate: Math.round(((b.started - b.completed) / b.started) * 100)
    }))
    .sort((a, b) => b.escapeRate - a.escapeRate)
    .slice(0, 8);

  const flowCounts: Record<string, number> = {};
  const pulseAbandonedByReason: Record<string, number> = {};
  let flowTimeToActionSum = 0;
  let flowTimeToActionCount = 0;
  for (const row of events as Array<Record<string, unknown>>) {
    if (String(row.type ?? "") !== "flow_event") continue;
    const p = row.payload as Record<string, unknown> | null;
    const step = String(p?.step ?? "");
    if (!step) continue;
    flowCounts[step] = (flowCounts[step] ?? 0) + 1;
    if (step === "pulse_abandoned") {
      const extra = p?.extra as Record<string, unknown> | undefined;
      const reason = typeof extra?.closeReason === "string" ? extra.closeReason : "unknown";
      pulseAbandonedByReason[reason] = (pulseAbandonedByReason[reason] ?? 0) + 1;
    }
    if (p?.timeToAction != null && typeof p.timeToAction === "number") {
      flowTimeToActionSum += p.timeToAction;
      flowTimeToActionCount += 1;
    }
  }
  const addPersonOpened = flowCounts["add_person_opened"] ?? 0;
  const addPersonDropped = flowCounts["add_person_dropped"] ?? 0;
  const addPersonDoneShowOnMap = flowCounts["add_person_done_show_on_map"] ?? 0;
  const addPersonCompletionRate =
    addPersonOpened > 0 ? Math.round(((addPersonOpened - addPersonDropped) / addPersonOpened) * 100) : null;

  const flowStats = {
    byStep: flowCounts,
    avgTimeToActionMs: flowTimeToActionCount > 0 ? Math.round(flowTimeToActionSum / flowTimeToActionCount) : null,
    addPersonCompletionRate,
    pulseAbandonedByReason
  };

  res.status(200).json({
    totalUsers: usersCount ?? null,
    activeNow: activeCount ?? null,
    avgMood: moodCount ? Math.round((moodSum / moodCount) * 10) / 10 : null,
    aiTokensUsed: aiLogsCount ?? null,
    growthData,
    zones,
    phaseOneGoal: {
      registeredUsers: usersCount ?? 0,
      installedUsers,
      addedPeople: addedPeopleCount ?? 0
    },
    awarenessGap: awarenessGap ?? undefined,
    funnel,
    topScenarios,
    emergencyLogs,
    taskFriction,
    weeklyRhythm,
    flowStats,
    conversionHealth: {
      pathStarted24h: pathStarted24h ?? 0,
      journeyMapsTotal: journeyMapsTotal ?? 0,
      addPersonOpened,
      addPersonDoneShowOnMap
    },
    routingV2: {
      decisions: decisionsV2.length,
      outcomes: outcomesV2.length,
      explorationCount,
      exploitationCount,
      explorationRate,
      completionRate,
      completionRateActedOnly,
      topSwarmEdges: topSwarmEdges.slice(0, 10).map((row) => ({
        edgeId: String(row.edge_id ?? ""),
        segmentKey: String(row.segment_key ?? ""),
        trials: Number(row.trials ?? 0),
        successes: Number(row.successes ?? 0),
        avgCompletion: Number(row.avg_completion ?? 0),
        decayFactor: Number(row.decay_factor ?? 1)
      }))
    },
    routingTelemetry: {
      cacheHealth: {
        totalDecisions: decisionsV2.length,
        v2Decisions,
        fallbackDecisions,
        fallbackRatePct
      },
      explorationHealth: {
        explorationDecisions: explorationDecisionsRows.length,
        exploitationDecisions: exploitationDecisionsRows.length,
        explorationSharePct:
          decisionsV2.length > 0 ? Math.round((explorationDecisionsRows.length / decisionsV2.length) * 10000) / 100 : null,
        explorationCompletionRatePct: completionRateForDecisionRows(explorationDecisionsRows),
        exploitationCompletionRatePct: completionRateForDecisionRows(exploitationDecisionsRows)
      },
      cognitiveEffectiveness: {
        byCapacityBand,
        completionMatrix: completionMatrixRows
      },
      segmentCoverage,
      latencyQuality: {
        sampleCount: noiseSampleCount,
        avgRawElapsedSec,
        avgActiveElapsedSec,
        avgIdleElapsedSec,
        avgHesitationSec,
        noiseFilteredPct
      },
      interventionHealth: {
        totalInterventions,
        interventionRatePct,
        bySegment: interventionBySegmentRows
      }
    }
  });
}

async function handleFeedback(client: SupabaseClient, req: RequestLike, res: JsonResponder) {
  const limit = safeLimit(req.query?.limit, 100, 500);
  const search = String(req.query?.search ?? "").trim().toLowerCase();

  const { data, error } = await client
    .from("journey_events")
    .select("id,session_id,payload,created_at")
    .eq("type", "flow_event")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    res.status(500).json({ error: "Failed to fetch feedback entries" });
    return;
  }

  type FeedbackEntry = {
    id: string;
    session_id: string;
    category: string;
    rating: number | null;
    message: string;
    created_at: string;
  };

  const entries = (data ?? [])
    .map((row: Record<string, unknown>): FeedbackEntry | null => {
      const payload = row.payload as Record<string, unknown> | null;
      if (String(payload?.step ?? "") !== "feedback_submitted") return null;
      const extra = payload?.extra as Record<string, unknown> | undefined;
      const message = String(extra?.message ?? "").trim();
      return {
        id: String(row.id ?? row.created_at ?? ""),
        session_id: String(row.session_id ?? "anonymous"),
        category: String(extra?.category ?? "general"),
        rating: typeof extra?.rating === "number" ? extra.rating : null,
        message,
        created_at: String(row.created_at ?? "")
      };
    })
    .filter((entry: FeedbackEntry | null): entry is FeedbackEntry => Boolean(entry && entry.message));

  const filtered = search
    ? entries.filter((entry: FeedbackEntry) =>
        `${entry.message} ${entry.category} ${entry.session_id}`.toLowerCase().includes(search)
      )
    : entries;

  res.status(200).json({
    entries: filtered.slice(0, limit)
  });
}

async function handleSupportTicketsGet(client: SupabaseClient, req: RequestLike, res: JsonResponder) {
  const limit = safeLimit(req.query?.limit, 100, 500);
  const search = String(req.query?.search ?? "").trim().toLowerCase();
  const status = String(req.query?.status ?? "").trim().toLowerCase();

  const { data, error } = await client
    .from("support_tickets")
    .select("id,created_at,updated_at,source,status,priority,title,message,session_id,category,assignee,metadata")
    .order("updated_at", { ascending: false })
    .limit(2000);

  if (error) {
    res.status(500).json({ error: "Failed to fetch support tickets" });
    return;
  }

  const tickets = ((data ?? []) as Array<Record<string, unknown>>).filter((row) => {
    const rowStatus = String(row.status ?? "open").toLowerCase();
    if (status && rowStatus !== status) return false;
    if (!search) return true;
    const blob = `${row.title ?? ""} ${row.message ?? ""} ${row.category ?? ""} ${row.session_id ?? ""}`.toLowerCase();
    return blob.includes(search);
  });

  res.status(200).json({ tickets: tickets.slice(0, limit) });
}

async function handleSupportTicketsPost(client: SupabaseClient, req: RequestLike, res: JsonResponder) {
  const body = await parseJsonBody(req);
  const action = String(body?.action ?? "create");

  if (action === "create") {
    const title = String(body?.title ?? "").trim();
    const message = String(body?.message ?? "").trim();
    if (!title || !message) {
      res.status(400).json({ error: "title and message are required" });
      return;
    }
    const insertPayload = {
      source: String(body?.source ?? "manual"),
      status: String(body?.status ?? "open"),
      priority: String(body?.priority ?? "normal"),
      title,
      message,
      session_id: body?.sessionId ? String(body.sessionId) : null,
      category: body?.category ? String(body.category) : null,
      assignee: body?.assignee ? String(body.assignee) : null,
      metadata: body?.metadata && typeof body.metadata === "object" ? body.metadata : {}
    };
    const { data, error } = await client
      .from("support_tickets")
      .insert(insertPayload)
      .select("id,created_at,updated_at,source,status,priority,title,message,session_id,category,assignee,metadata")
      .single();
    if (error) {
      res.status(500).json({ error: "Failed to create support ticket" });
      return;
    }
    await recordAdminAudit(req, "support_ticket_create", {
      ticketId: String((data as Record<string, unknown> | null)?.id ?? ""),
      source: insertPayload.source,
      priority: insertPayload.priority
    });
    res.status(200).json({ ok: true, ticket: data });
    return;
  }

  if (action === "update-status") {
    const id = String(body?.id ?? "").trim();
    const nextStatus = String(body?.status ?? "").trim();
    if (!id || !nextStatus) {
      res.status(400).json({ error: "id and status are required" });
      return;
    }
    const patch: Record<string, unknown> = { status: nextStatus };
    if (body?.assignee != null) patch.assignee = String(body.assignee || "");
    const { data, error } = await client
      .from("support_tickets")
      .update(patch)
      .eq("id", id)
      .select("id,created_at,updated_at,source,status,priority,title,message,session_id,category,assignee,metadata")
      .single();
    if (error) {
      res.status(500).json({ error: "Failed to update support ticket" });
      return;
    }
    await recordAdminAudit(req, "support_ticket_status_update", {
      ticketId: id,
      status: nextStatus
    });
    res.status(200).json({ ok: true, ticket: data });
    return;
  }

  res.status(400).json({ error: "Unsupported action" });
}

async function handleOwnerAlerts(client: SupabaseClient, req: RequestLike, res: JsonResponder) {
  const now = new Date();
  const sinceRaw = String(req.query?.since ?? "").trim();
  const phaseTarget = safeLimit(req.query?.phaseTarget, 10, 100);
  const fallbackSince = new Date(now.getTime() - 5 * 60 * 1000);
  const parsedSince = sinceRaw
    ? (() => {
        const asNumber = Number(sinceRaw);
        if (Number.isFinite(asNumber)) return new Date(asNumber);
        return new Date(sinceRaw);
      })()
    : fallbackSince;
  const sinceDate =
    Number.isNaN(parsedSince.getTime()) ? fallbackSince : parsedSince;
  const sinceIso = sinceDate.toISOString();

  const [{ data: recentEvents, error: eventsError }, { count: registeredUsersCount }, { count: addedPeopleCount }, { data: installedSessionsRows }] =
    await Promise.all([
      client
        .from("journey_events")
        .select("session_id,type,payload,created_at")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: true })
        .limit(5000),
      client.from("profiles").select("id", { count: "exact", head: true }),
      client.from("journey_events").select("id", { count: "exact", head: true }).eq("type", "node_added"),
      client
        .from("journey_events")
        .select("session_id")
        .eq("type", "flow_event")
        .contains("payload", { step: "install_clicked" })
        .not("session_id", "is", null)
        .limit(10000)
    ]);

  if (eventsError) {
    res.status(500).json({ error: "Failed to fetch owner alerts" });
    return;
  }

  const events = (recentEvents ?? []) as Array<Record<string, unknown>>;

  const sessionCandidates = Array.from(
    new Set(
      events
        .map((row) => String(row.session_id ?? "").trim())
        .filter(Boolean)
    )
  );

  let previousSessionRows: Array<{ session_id?: string }> = [];
  if (sessionCandidates.length > 0) {
    const { data } = await client
      .from("journey_events")
      .select("session_id,created_at")
      .in("session_id", sessionCandidates)
      .lt("created_at", sinceIso)
      .limit(10000);
    previousSessionRows = (data ?? []) as Array<{ session_id?: string }>;
  }

  const existingBeforeWindow = new Set(
    previousSessionRows.map((row) => String(row.session_id ?? "").trim()).filter(Boolean)
  );
  const newVisitorSessionIds = sessionCandidates.filter((sid) => !existingBeforeWindow.has(sid));

  const loginSessionIds = Array.from(
    new Set(
      events
        .filter((row) => {
          if (String(row.type ?? "") !== "flow_event") return false;
          const payload = row.payload as Record<string, unknown> | null;
          return String(payload?.step ?? "") === "auth_login_success";
        })
        .map((row) => String(row.session_id ?? "").trim())
        .filter(Boolean)
    )
  );

  const installSessionIds = Array.from(
    new Set(
      events
        .filter((row) => {
          if (String(row.type ?? "") !== "flow_event") return false;
          const payload = row.payload as Record<string, unknown> | null;
          return String(payload?.step ?? "") === "install_clicked";
        })
        .map((row) => String(row.session_id ?? "").trim())
        .filter(Boolean)
    )
  );

  const installedUsers = new Set(
    ((installedSessionsRows ?? []) as Array<{ session_id?: unknown }>)
      .map((row) => String(row.session_id ?? "").trim())
      .filter(Boolean)
  ).size;

  const phaseProgress = {
    registeredUsers: registeredUsersCount ?? 0,
    installedUsers,
    addedPeople: addedPeopleCount ?? 0,
    target: phaseTarget
  };

  const phaseMilestones = {
    registeredReached: phaseProgress.registeredUsers >= phaseTarget,
    installedReached: phaseProgress.installedUsers >= phaseTarget,
    addedReached: phaseProgress.addedPeople >= phaseTarget
  };

  res.status(200).json({
    generatedAt: now.toISOString(),
    since: sinceIso,
    newVisitors: {
      count: newVisitorSessionIds.length,
      sessionIds: newVisitorSessionIds.slice(0, 200)
    },
    logins: {
      count: loginSessionIds.length,
      sessionIds: loginSessionIds.slice(0, 200)
    },
    installs: {
      count: installSessionIds.length,
      sessionIds: installSessionIds.slice(0, 200)
    },
    phaseOne: {
      ...phaseProgress,
      ...phaseMilestones,
      fullyCompleted:
        phaseMilestones.registeredReached &&
        phaseMilestones.installedReached &&
        phaseMilestones.addedReached
    }
  });
}

async function handleOpsInsights(client: SupabaseClient, res: JsonResponder) {
  const now = new Date();
  const since1d = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const prev1dStart = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const prev7dStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since60d = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: profiles },
    { count: userState },
    { count: eventsTotal },
    { count: mapsTotal },
    { count: events1d },
    { count: eventsPrev1d },
    { count: events7d },
    { count: eventsPrev7d },
    { count: events30d },
    { count: nodeAdded },
    { count: pathStarted },
    { count: taskCompleted },
    { count: identified },
    { count: anonymous },
    { data: flowRows },
    { data: recentEventsRows }
  ] = await Promise.all([
    client.from("profiles").select("id", { count: "exact", head: true }),
    client.from("user_state").select("device_token", { count: "exact", head: true }),
    client.from("journey_events").select("id", { count: "exact", head: true }),
    client.from("journey_maps").select("session_id", { count: "exact", head: true }),
    client.from("journey_events").select("id", { count: "exact", head: true }).gte("created_at", since1d),
    client.from("journey_events").select("id", { count: "exact", head: true }).gte("created_at", prev1dStart).lt("created_at", since1d),
    client.from("journey_events").select("id", { count: "exact", head: true }).gte("created_at", since7d),
    client.from("journey_events").select("id", { count: "exact", head: true }).gte("created_at", prev7dStart).lt("created_at", since7d),
    client.from("journey_events").select("id", { count: "exact", head: true }).gte("created_at", since30d),
    client.from("journey_events").select("id", { count: "exact", head: true }).eq("type", "node_added"),
    client.from("journey_events").select("id", { count: "exact", head: true }).eq("type", "path_started"),
    client.from("journey_events").select("id", { count: "exact", head: true }).eq("type", "task_completed"),
    client.from("journey_events").select("id", { count: "exact", head: true }).eq("mode", "identified"),
    client.from("journey_events").select("id", { count: "exact", head: true }).eq("mode", "anonymous"),
    client
      .from("journey_events")
      .select("payload,session_id")
      .eq("type", "flow_event")
      .gte("created_at", since30d)
      .order("created_at", { ascending: false })
      .limit(10000),
    client
      .from("journey_events")
      .select("session_id,created_at,type,mode")
      .gte("created_at", since60d)
      .order("created_at", { ascending: false })
      .limit(50000)
  ]);

  const flowCounts: Record<string, number> = {};
  const sessions30d = new Set<string>();
  const segmentByChannel: Record<string, number> = {};
  const segmentByDevice: Record<string, number> = {};
  for (const row of (flowRows ?? []) as Array<Record<string, unknown>>) {
    const payload = row.payload as Record<string, unknown> | null;
    const step = String(payload?.step ?? "");
    if (!step) continue;
    flowCounts[step] = (flowCounts[step] ?? 0) + 1;
    const sid = String(row.session_id ?? "").trim();
    if (sid) sessions30d.add(sid);
    const channel = String(payload?.source ?? payload?.utm_source ?? payload?.channel ?? payload?.referrer ?? "").trim().toLowerCase();
    if (channel) segmentByChannel[channel] = (segmentByChannel[channel] ?? 0) + 1;
    const device = String(payload?.device ?? payload?.platform ?? "").trim().toLowerCase();
    if (device) segmentByDevice[device] = (segmentByDevice[device] ?? 0) + 1;
  }

  const funnel = {
    landingViewed: flowCounts.landing_viewed ?? 0,
    startClicked: flowCounts.landing_clicked_start ?? 0,
    addPersonOpened: flowCounts.add_person_opened ?? 0,
    addPersonDone: flowCounts.add_person_done_show_on_map ?? 0,
    startPathCTA: flowCounts.add_person_start_path_clicked ?? 0
  };

  const identifiedTotal = (identified ?? 0) + (anonymous ?? 0);
  const identifiedRate = identifiedTotal > 0 ? Math.round(((identified ?? 0) / identifiedTotal) * 100) : 0;
  const cmp = (current: number, previous: number) => (previous > 0 ? Math.round(((current - previous) / previous) * 100) : (current > 0 ? 100 : 0));

  const cohortSessions = new Map<string, { firstAt: number; lastAt: number; hasPath: boolean }>();
  for (const row of (recentEventsRows ?? []) as Array<Record<string, unknown>>) {
    const sid = String(row.session_id ?? "").trim();
    if (!sid) continue;
    const createdAt = new Date(String(row.created_at ?? "")).getTime();
    if (Number.isNaN(createdAt)) continue;
    const type = String(row.type ?? "");
    const current = cohortSessions.get(sid);
    if (!current) {
      cohortSessions.set(sid, { firstAt: createdAt, lastAt: createdAt, hasPath: type === "path_started" });
      continue;
    }
    if (createdAt < current.firstAt) current.firstAt = createdAt;
    if (createdAt > current.lastAt) current.lastAt = createdAt;
    if (type === "path_started") current.hasPath = true;
  }

  const cohort = {
    newSessions30d: 0,
    retained7d: 0,
    retained30d: 0,
    activationRate: 0
  };
  const nowMs = now.getTime();
  let activatedCount = 0;
  for (const value of cohortSessions.values()) {
    const ageDays = (nowMs - value.firstAt) / (24 * 60 * 60 * 1000);
    if (ageDays <= 30) {
      cohort.newSessions30d += 1;
      if (value.hasPath) activatedCount += 1;
      if (ageDays >= 7 && value.lastAt - value.firstAt >= 7 * 24 * 60 * 60 * 1000) cohort.retained7d += 1;
      if (ageDays >= 30 && value.lastAt - value.firstAt >= 30 * 24 * 60 * 60 * 1000) cohort.retained30d += 1;
    }
  }
  cohort.activationRate = cohort.newSessions30d > 0 ? Math.round((activatedCount / cohort.newSessions30d) * 100) : 0;

  const warnings: string[] = [];
  const alerts: Array<{ level: "critical" | "warning" | "info"; code: string; title: string; metric: number; threshold: number }> = [];
  if ((mapsTotal ?? 0) === 0 && (nodeAdded ?? 0) > 0) warnings.push("تمت إضافات أشخاص لكن لا توجد خرائط محفوظة.");
  if ((pathStarted ?? 0) === 0) warnings.push("لا توجد أي بدايات مسار.");
  if (funnel.addPersonOpened > 0 && Math.round((funnel.addPersonDone / funnel.addPersonOpened) * 100) < 30) {
    warnings.push("تحويل ما بعد إضافة الشخص منخفض جدًا.");
  }
  if (identifiedRate < 25) warnings.push("نسبة identified منخفضة وتضعف التتبع الفردي.");

  if ((mapsTotal ?? 0) === 0 && (nodeAdded ?? 0) > 0) {
    alerts.push({ level: "critical", code: "maps_not_persisted", title: "الإضافات لا تتحول لخرائط محفوظة", metric: mapsTotal ?? 0, threshold: 1 });
  }
  if ((pathStarted ?? 0) === 0) {
    alerts.push({ level: "critical", code: "no_path_started", title: "لا يوجد بدء مسار", metric: pathStarted ?? 0, threshold: 1 });
  }
  if (identifiedRate < 25) {
    alerts.push({ level: "warning", code: "low_identified_rate", title: "جودة تتبع ضعيفة", metric: identifiedRate, threshold: 25 });
  }
  if (cohort.activationRate < 20) {
    alerts.push({ level: "warning", code: "low_activation", title: "تفعيل منخفض للمستخدمين الجدد", metric: cohort.activationRate, threshold: 20 });
  }

  const topSegments = (input: Record<string, number>) =>
    Object.entries(input)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, count]) => ({ key, count }));

  res.status(200).json({
    generatedAt: now.toISOString(),
    totals: {
      profiles: profiles ?? 0,
      userState: userState ?? 0,
      eventsTotal: eventsTotal ?? 0,
      mapsTotal: mapsTotal ?? 0,
      sessions30d: sessions30d.size
    },
    activity: {
      events1d: events1d ?? 0,
      events7d: events7d ?? 0,
      events30d: events30d ?? 0
    },
    comparisons: {
      events1dDelta: cmp(events1d ?? 0, eventsPrev1d ?? 0),
      events7dDelta: cmp(events7d ?? 0, eventsPrev7d ?? 0)
    },
    journey: {
      nodeAdded: nodeAdded ?? 0,
      pathStarted: pathStarted ?? 0,
      taskCompleted: taskCompleted ?? 0
    },
    tracking: {
      identified: identified ?? 0,
      anonymous: anonymous ?? 0,
      identifiedRate
    },
    segments: {
      byMode: [
        { key: "identified", count: identified ?? 0 },
        { key: "anonymous", count: anonymous ?? 0 }
      ],
      byChannel: topSegments(segmentByChannel),
      byDevice: topSegments(segmentByDevice)
    },
    cohort,
    funnel,
    alerts,
    warnings
  });
}

async function handleExecutiveReport(client: SupabaseClient, res: JsonResponder) {
  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const gate7Start = new Date(now.getTime() - 48 * 60 * 60 * 1000).getTime();

  const [{ data: flowRows }, { data: weeklyRows }, { count: events24h }, { count: pathStarted24h }, { count: nodesAdded24h }, { count: mapsTotal }] =
    await Promise.all([
      client
        .from("journey_events")
        .select("payload,session_id,created_at")
        .eq("type", "flow_event")
        .gte("created_at", since30d)
        .order("created_at", { ascending: false })
        .limit(20000),
      client
        .from("journey_events")
        .select("session_id,type,payload,created_at")
        .gte("created_at", since7d)
        .lt("created_at", now.toISOString())
        .limit(5000),
      client.from("journey_events").select("id", { count: "exact", head: true }).gte("created_at", since24h),
      client.from("journey_events").select("id", { count: "exact", head: true }).eq("type", "path_started").gte("created_at", since24h),
      client.from("journey_events").select("id", { count: "exact", head: true }).eq("type", "node_added").gte("created_at", since24h),
      client.from("journey_maps").select("session_id", { count: "exact", head: true })
    ]);

  const channelCounts: Record<string, number> = {};
  const campaignCounts: Record<string, number> = {};
  const mediumCounts: Record<string, number> = {};
  const sessionFirstSeen = new Map<string, number>();
  const sessionLastSeen = new Map<string, number>();
  let installClicked = 0;
  let addPersonOpened = 0;
  let addPersonDone = 0;

  for (const row of (flowRows ?? []) as Array<Record<string, unknown>>) {
    const payload = row.payload as Record<string, unknown> | null;
    const sid = String(row.session_id ?? "").trim();
    const ts = new Date(String(row.created_at ?? "")).getTime();
    if (sid && !Number.isNaN(ts)) {
      const first = sessionFirstSeen.get(sid);
      const last = sessionLastSeen.get(sid);
      if (first == null || ts < first) sessionFirstSeen.set(sid, ts);
      if (last == null || ts > last) sessionLastSeen.set(sid, ts);
    }

    const step = String(payload?.step ?? "");
    if (step === "install_clicked") installClicked += 1;
    if (step === "add_person_opened") addPersonOpened += 1;
    if (step === "add_person_done_show_on_map") addPersonDone += 1;

    const source = String(payload?.utm_source ?? payload?.source ?? payload?.channel ?? "").trim().toLowerCase();
    const medium = String(payload?.utm_medium ?? payload?.medium ?? "").trim().toLowerCase();
    const campaign = String(payload?.utm_campaign ?? payload?.campaign ?? "").trim().toLowerCase();
    if (source) channelCounts[source] = (channelCounts[source] ?? 0) + 1;
    if (medium) mediumCounts[medium] = (mediumCounts[medium] ?? 0) + 1;
    if (campaign) campaignCounts[campaign] = (campaignCounts[campaign] ?? 0) + 1;
  }

  const top = (input: Record<string, number>, limit = 5) =>
    Object.entries(input)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key, count]) => ({ key, count }));

  let retained7d = 0;
  let eligible7d = 0;
  const nowMs = now.getTime();
  for (const [sid, first] of sessionFirstSeen.entries()) {
    const ageDays = (nowMs - first) / (24 * 60 * 60 * 1000);
    if (ageDays < 7) continue;
    eligible7d += 1;
    const last = sessionLastSeen.get(sid) ?? first;
    if (last - first >= 7 * 24 * 60 * 60 * 1000) retained7d += 1;
  }
  const retention7d = eligible7d > 0 ? Math.round((retained7d / eligible7d) * 100) : 0;
  const addPersonCompletionRate = addPersonOpened > 0 ? Math.round((addPersonDone / addPersonOpened) * 100) : 0;
  const weeklyTypeCounts: Record<string, number> = {};
  const weeklySessions = new Set<string>();
  let weeklyAffiliateExposed = 0;
  let weeklyAffiliateClicked = 0;
  let weeklyPathStarted48h = 0;

  for (const row of (weeklyRows ?? []) as Array<Record<string, unknown>>) {
    const type = String(row.type ?? "");
    weeklyTypeCounts[type] = (weeklyTypeCounts[type] ?? 0) + 1;

    const sid = String(row.session_id ?? "").trim();
    if (sid) weeklySessions.add(sid);

    const createdAtMs = new Date(String(row.created_at ?? "")).getTime();
    if (type === "path_started" && !Number.isNaN(createdAtMs) && createdAtMs >= gate7Start) {
      weeklyPathStarted48h += 1;
    }

    if (type !== "flow_event") continue;
    const payload = row.payload as Record<string, unknown> | null;
    const step = String(payload?.step ?? "");
    if (step === "affiliate_link_exposed") weeklyAffiliateExposed += 1;
    if (step === "affiliate_link_clicked") weeklyAffiliateClicked += 1;
  }

  const weeklyAffiliateCtr =
    weeklyAffiliateExposed > 0 ? Math.round((weeklyAffiliateClicked / weeklyAffiliateExposed) * 10000) / 100 : 0;
  const weeklyGate7Status = weeklyPathStarted48h > 0 ? "ok" : "critical";
  const consciousRevenue = computeConsciousRevenueSnapshot({
    typeCounts: weeklyTypeCounts,
    uniqueSessions: weeklySessions.size,
    affiliateCtr: weeklyAffiliateCtr,
    gate7Status: weeklyGate7Status
  });

  const operationalAlerts: string[] = [];
  if ((events24h ?? 0) === 0) operationalAlerts.push("انقطاع كامل: لا توجد أحداث خلال 24 ساعة.");
  if ((nodesAdded24h ?? 0) > 0 && (mapsTotal ?? 0) === 0) operationalAlerts.push("إضافات أشخاص بلا خرائط محفوظة.");
  if ((pathStarted24h ?? 0) === 0) operationalAlerts.push("لا توجد بدايات مسار خلال 24 ساعة.");
  if (addPersonOpened > 0 && addPersonCompletionRate < 30) operationalAlerts.push("هبوط قوي في إتمام إضافة الشخص.");

  const recommendedActions: string[] = [];
  if ((pathStarted24h ?? 0) === 0) recommendedActions.push("فعّل CTA مباشر بعد الإضافة: ابدأ المسار الآن.");
  if ((mapsTotal ?? 0) === 0 && (nodesAdded24h ?? 0) > 0) recommendedActions.push("اختبر حفظ الخريطة end-to-end فورًا في الإنتاج.");
  if (retention7d < 20) recommendedActions.push("أضف إعادة تنشيط D+1/D+3 للمستخدمين غير العائدين.");
  if (!top(channelCounts, 1).length) recommendedActions.push("أكمل تمرير UTM لتحديد مصادر النمو.");

  res.status(200).json({
    generatedAt: now.toISOString(),
    kpis: {
      events24h: events24h ?? 0,
      pathStarted24h: pathStarted24h ?? 0,
      nodesAdded24h: nodesAdded24h ?? 0,
      mapsTotal: mapsTotal ?? 0,
      addPersonCompletionRate,
      retention7d
    },
    attribution: {
      topSources: top(channelCounts),
      topMediums: top(mediumCounts),
      topCampaigns: top(campaignCounts),
      installClicked
    },
    reliability: {
      status: operationalAlerts.length > 0 ? "warning" : "healthy",
      alerts: operationalAlerts
    },
    recommendedActions,
    consciousRevenue
  });
}

async function handleSystemHealth(client: SupabaseClient, res: JsonResponder) {
  const probeStart = Date.now();
  const { error } = await client.from("journey_events").select("id", { count: "exact", head: true }).limit(1);
  const probeMs = Date.now() - probeStart;
  const uptimeSec = Math.max(0, Math.round((Date.now() - overviewRuntimeStats.startedAt) / 1000));
  const recent = overviewRuntimeStats.latencyMs;
  const errRate = overviewRuntimeStats.requests > 0
    ? Math.round((overviewRuntimeStats.errors / overviewRuntimeStats.requests) * 1000) / 10
    : 0;

  res.status(200).json({
    generatedAt: new Date().toISOString(),
    status: error ? "degraded" : "healthy",
    probe: {
      supabaseReachable: !error,
      supabaseProbeMs: probeMs
    },
    api: {
      uptimeSec,
      requests: overviewRuntimeStats.requests,
      errors: overviewRuntimeStats.errors,
      errorRate: errRate,
      p50LatencyMs: percentile(recent, 50),
      p95LatencyMs: percentile(recent, 95),
      lastErrorAt: overviewRuntimeStats.lastErrorAt ? new Date(overviewRuntimeStats.lastErrorAt).toISOString() : null
    }
  });
}

async function handleSecuritySignals(client: SupabaseClient, res: JsonResponder) {
  const now = Date.now();
  const since24hIso = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const { data: recentAuditRows, error: auditError } = await client
    .from("admin_audit_logs")
    .select("action,payload,created_at")
    .gte("created_at", since24hIso)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (auditError) {
    res.status(200).json({
      generatedAt: new Date().toISOString(),
      status: "warning",
      config: {
        adminSecretStrong: (process.env.ADMIN_API_SECRET || "").trim().length >= 16,
        serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        secureTransportConfigured: String(process.env.PUBLIC_APP_URL || "").startsWith("https://")
      },
      metrics: {
        authFailed15m: 0,
        authRateLimited15m: 0,
        adminErrors15m: 0
      },
      incidents: [],
      warnings: ["تعذر قراءة سجل تدقيق الأمان."]
    });
    return;
  }

  const rows = (recentAuditRows ?? []) as Array<Record<string, unknown>>;
  const rows15m = rows.filter((row) => {
    const createdAt = new Date(String(row.created_at ?? "")).getTime();
    return Number.isFinite(createdAt) && createdAt >= Date.now() - 15 * 60 * 1000;
  });

  const authFailed15m = rows15m.filter((row) => String(row.action ?? "") === "admin_auth_failed").length;
  const authRateLimited15m = rows15m.filter((row) => String(row.action ?? "") === "admin_auth_rate_limited").length;
  const adminErrors15m = rows15m.filter((row) => String(row.action ?? "") === "admin_api_error").length;

  const adminSecretStrong = (process.env.ADMIN_API_SECRET || "").trim().length >= 16;
  const serviceRoleConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const secureTransportConfigured = String(process.env.PUBLIC_APP_URL || "").startsWith("https://");

  const warnings: string[] = [];
  if (!adminSecretStrong) warnings.push("ADMIN_API_SECRET غير مضبوط أو ضعيف (أقل من 16 حرف).");
  if (!serviceRoleConfigured) warnings.push("SUPABASE_SERVICE_ROLE_KEY غير مضبوط.");
  if (!secureTransportConfigured) warnings.push("PUBLIC_APP_URL لا يبدأ بـ https.");
  if (authFailed15m > 0) warnings.push(`محاولات دخول فاشلة خلال 15 دقيقة: ${authFailed15m}`);
  if (authRateLimited15m > 0) warnings.push(`تم تفعيل حظر محاولات الدخول ${authRateLimited15m} مرة خلال 15 دقيقة.`);
  if (adminErrors15m > 0) warnings.push(`أخطاء Admin API خلال 15 دقيقة: ${adminErrors15m}`);

  const status =
    !adminSecretStrong || !serviceRoleConfigured || authRateLimited15m > 0 || adminErrors15m >= 3
      ? "critical"
      : warnings.length > 0
        ? "warning"
        : "healthy";

  const incidents = rows
    .filter((row) => {
      const action = String(row.action ?? "");
      return action === "admin_auth_failed" || action === "admin_auth_rate_limited" || action === "admin_api_error";
    })
    .slice(0, 12)
    .map((row) => ({
      action: String(row.action ?? "unknown"),
      createdAt: String(row.created_at ?? ""),
      payload: (row.payload as Record<string, unknown> | null) ?? {}
    }));

  res.status(200).json({
    generatedAt: new Date().toISOString(),
    status,
    config: {
      adminSecretStrong,
      serviceRoleConfigured,
      secureTransportConfigured
    },
    metrics: {
      authFailed15m,
      authRateLimited15m,
      adminErrors15m
    },
    incidents,
    warnings
  });
}

async function captureJson(handler: (res: JsonResponder) => Promise<void> | void): Promise<{ status: number; body: unknown }> {
  let statusCode = 200;
  let body: unknown = null;
  const mockRes: JsonResponder = {
    status: (code: number) => {
      statusCode = code;
      return mockRes;
    },
    json: (data: unknown) => {
      body = data;
      return mockRes;
    }
  };
  await handler(mockRes);
  return { status: statusCode, body };
}

async function handleOwnerOps(client: SupabaseClient, req: RequestLike, res: JsonResponder) {
  const [systemHealth, securitySignals, ownerAlerts] = await Promise.all([
    captureJson((mockRes) => handleSystemHealth(client, mockRes)),
    captureJson((mockRes) => handleSecuritySignals(client, mockRes)),
    captureJson((mockRes) => handleOwnerAlerts(client, req, mockRes))
  ]);
  const systemHealthBody = (systemHealth.body ?? {}) as { status?: string };
  const securitySignalsBody = (securitySignals.body ?? {}) as { status?: string };
  const ownerAlertsBody = (ownerAlerts.body ?? {}) as { phaseOne?: { fullyCompleted?: boolean } };

  const status =
    (securitySignalsBody.status === "critical" || systemHealthBody.status === "degraded")
      ? "critical"
      : (securitySignalsBody.status === "warning" ||
         ownerAlertsBody.phaseOne?.fullyCompleted === false)
        ? "warning"
        : "healthy";

  res.status(200).json({
    generatedAt: new Date().toISOString(),
    status,
    systemHealth: systemHealth.body ?? null,
    securitySignals: securitySignals.body ?? null,
    ownerAlerts: ownerAlerts.body ?? null
  });
}

async function handleDailyReport(client: SupabaseClient, req: RequestLike, res: JsonResponder) {
  const dateParam = String(req.query?.date ?? "");
  const baseDate = dateParam ? new Date(`${dateParam}T00:00:00Z`) : new Date();
  const start = new Date(baseDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const { data: events, error } = await client
    .from("journey_events")
    .select("session_id,type,created_at,payload")
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString())
    .limit(2000);

  if (error) {
    res.status(500).json({ error: "Failed to fetch events" });
    return;
  }

  const bySession = new Map<string, { total: number; paths: number; tasks: number; nodes: number; moods: number }>();
  const typeCounts: Record<string, number> = {};
  let totalEvents = 0;

  for (const row of (events ?? []) as Array<Record<string, unknown>>) {
    const sessionId = String(row.session_id ?? "anonymous");
    const entry = bySession.get(sessionId) ?? { total: 0, paths: 0, tasks: 0, nodes: 0, moods: 0 };
    entry.total += 1;
    totalEvents += 1;
    const type = String(row.type ?? "");
    typeCounts[type] = (typeCounts[type] ?? 0) + 1;
    if (type === "path_started") entry.paths += 1;
    if (type === "task_completed") entry.tasks += 1;
    if (type === "node_added") entry.nodes += 1;
    if (type === "mood_logged") entry.moods += 1;
    bySession.set(sessionId, entry);
  }

  const topSessions = Array.from(bySession.entries())
    .map(([sessionId, stats]) => ({ sessionId, ...stats }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const report = {
    date: toDateOnly(start),
    totalEvents,
    uniqueSessions: bySession.size,
    typeCounts,
    topSessions
  };

  if (String(req.query?.store ?? "") === "1") {
    await client.from("admin_reports").insert({
      kind: "daily",
      payload: report
    });
  }

  res.status(200).json(report);
}

async function handleWeeklyReport(client: SupabaseClient, req: RequestLike, res: JsonResponder) {
  const windowDays = normalizeWeeklyWindowDays(req.query?.days);
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const gate7Hours = 48;
  const gate7Start = new Date(now.getTime() - gate7Hours * 60 * 60 * 1000);
  const gate7MinEvents48h = getPositiveEnvInt("GATE7_MIN_EVENTS_48H", 20);
  const gate7MinSessions48h = getPositiveEnvInt("GATE7_MIN_SESSIONS_48H", 8);

  const { data: events, error } = await client
    .from("journey_events")
    .select("session_id,type,created_at,payload")
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString())
    .limit(5000);

  if (error) {
    res.status(500).json({ error: "Failed to fetch events" });
    return;
  }

  const byDay = new Map<string, number>();
  const bySession = new Map<string, number>();
  const affiliateByDomain = new Map<string, { exposed: number; clicked: number }>();
  const affiliateByVariant = new Map<string, { exposed: number; clicked: number }>();
  const affiliateByMission = new Map<string, { exposed: number; clicked: number; missionLabel: string; ring: string }>();
  const typeCounts: Record<string, number> = {};
  let totalEvents = 0;
  let affiliateLinkExposed = 0;
  let affiliateLinkClicked = 0;
  let pathStarted48h = 0;
  let totalEvents48h = 0;
  const sessions48h = new Set<string>();

  for (const row of (events ?? []) as Array<Record<string, unknown>>) {
    const createdAt = new Date(String(row.created_at ?? now));
    const day = toDateOnly(createdAt);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
    const sessionId = String(row.session_id ?? "anonymous");
    bySession.set(sessionId, (bySession.get(sessionId) ?? 0) + 1);
    const type = String(row.type ?? "");
    typeCounts[type] = (typeCounts[type] ?? 0) + 1;
    totalEvents += 1;

    if (createdAt >= gate7Start) {
      totalEvents48h += 1;
      sessions48h.add(sessionId);
    }

    if (type === "path_started" && createdAt >= gate7Start) {
      pathStarted48h += 1;
    }

    if (type !== "flow_event") continue;
    const payload = row.payload as Record<string, unknown> | null;
    const step = String(payload?.step ?? "");
    if (step !== "affiliate_link_exposed" && step !== "affiliate_link_clicked") continue;

    const extra = payload?.extra as Record<string, unknown> | null | undefined;
    const domain = String(extra?.domain ?? "").trim().toLowerCase();
    const linkId = String(extra?.linkId ?? "").trim().toLowerCase();
    const missionKey = String(extra?.missionKey ?? "").trim().toLowerCase();
    const missionLabel = String(extra?.missionLabel ?? "").trim();
    const ring = String(extra?.ring ?? "").trim().toLowerCase();
    if (step === "affiliate_link_exposed") affiliateLinkExposed += 1;
    if (step === "affiliate_link_clicked") affiliateLinkClicked += 1;

    if (linkId.startsWith("variant_")) {
      const variantBucket = affiliateByVariant.get(linkId) ?? { exposed: 0, clicked: 0 };
      if (step === "affiliate_link_exposed") variantBucket.exposed += 1;
      if (step === "affiliate_link_clicked") variantBucket.clicked += 1;
      affiliateByVariant.set(linkId, variantBucket);
    }

    if (missionKey) {
      const missionBucket = affiliateByMission.get(missionKey) ?? {
        exposed: 0,
        clicked: 0,
        missionLabel: missionLabel || missionKey,
        ring: ring || "unknown"
      };
      if (step === "affiliate_link_exposed") missionBucket.exposed += 1;
      if (step === "affiliate_link_clicked") missionBucket.clicked += 1;
      affiliateByMission.set(missionKey, missionBucket);
    }

    if (!domain) continue;

    const bucket = affiliateByDomain.get(domain) ?? { exposed: 0, clicked: 0 };
    if (step === "affiliate_link_exposed") bucket.exposed += 1;
    if (step === "affiliate_link_clicked") bucket.clicked += 1;
    affiliateByDomain.set(domain, bucket);
  }

  const topSessions = Array.from(bySession.entries())
    .map(([sessionId, total]) => ({ sessionId, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const dailySeries = Array.from(byDay.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const affiliateCtr =
    affiliateLinkExposed > 0 ? Math.round((affiliateLinkClicked / affiliateLinkExposed) * 10000) / 100 : 0;
  const topAffiliateDomains = Array.from(affiliateByDomain.entries())
    .map(([domain, counts]) => ({
      domain,
      exposed: counts.exposed,
      clicked: counts.clicked,
      ctr: counts.exposed > 0 ? Math.round((counts.clicked / counts.exposed) * 10000) / 100 : 0
    }))
    .sort((a, b) => b.clicked - a.clicked)
    .slice(0, 10);
  const variantBreakdown = Array.from(affiliateByVariant.entries())
    .map(([variant, counts]) => ({
      variant,
      exposed: counts.exposed,
      clicked: counts.clicked,
      ctr: counts.exposed > 0 ? Math.round((counts.clicked / counts.exposed) * 10000) / 100 : 0
    }))
    .sort((a, b) => b.clicked - a.clicked);
  const missionBreakdown = Array.from(affiliateByMission.entries())
    .map(([missionKey, counts]) => ({
      missionKey,
      missionLabel: counts.missionLabel,
      ring: counts.ring,
      exposed: counts.exposed,
      clicked: counts.clicked,
      ctr: counts.exposed > 0 ? Math.round((counts.clicked / counts.exposed) * 10000) / 100 : 0
    }))
    .sort((a, b) => (b.ctr - a.ctr) || (b.clicked - a.clicked))
    .slice(0, 3);
  const gate7TrafficBaselineMet =
    totalEvents48h >= gate7MinEvents48h || sessions48h.size >= gate7MinSessions48h;
  const gate7Status = pathStarted48h > 0 || !gate7TrafficBaselineMet ? "ok" : "critical";
  const gate7Code =
    pathStarted48h > 0
      ? "ok"
      : gate7TrafficBaselineMet
      ? "gate7_path_started_zero"
      : "gate7_insufficient_traffic";
  const consciousRevenue = computeConsciousRevenueSnapshot({
    typeCounts,
    uniqueSessions: bySession.size,
    affiliateCtr,
    gate7Status
  });

  const report = {
    windowDays,
    from: toDateOnly(start),
    to: toDateOnly(end),
    totalEvents,
    uniqueSessions: bySession.size,
    typeCounts,
    dailySeries,
    topSessions,
    affiliate: {
      linkExposed: affiliateLinkExposed,
      linkClicked: affiliateLinkClicked,
      ctr: affiliateCtr,
      topDomains: topAffiliateDomains,
      variants: variantBreakdown,
      topMissions: missionBreakdown
    },
    gate7: {
      windowHours: gate7Hours,
      pathStarted48h,
      trafficEvents48h: totalEvents48h,
      trafficSessions48h: sessions48h.size,
      trafficBaselineMet: gate7TrafficBaselineMet,
      minEvents48h: gate7MinEvents48h,
      minSessions48h: gate7MinSessions48h,
      status: gate7Status,
      code: gate7Code
    },
    consciousRevenue
  };

  if (String(req.query?.store ?? "") === "1") {
    await client.from("admin_reports").insert({
      kind: "weekly",
      payload: report
    });
  }

  res.status(200).json(report);
}

async function handleFullExport(client: SupabaseClient, req: RequestLike, res: JsonResponder) {
  const limit = safeLimit(req.query?.limit, 2000, 10000);
  const [{ data: profiles }, { data: userStates }, { data: maps }, { data: events }, { data: pulseLogs }] =
    await Promise.all([
      client.from("profiles").select("id, full_name, email, role, created_at, last_seen").limit(1000),
      client.from("user_state").select("device_token, owner_id, updated_at, data").limit(1000),
      client.from("journey_maps").select("session_id, updated_at, nodes").limit(1000),
      client.from("journey_events").select("id, session_id, type, payload, created_at").limit(limit),
      client.from("daily_pulse_logs").select("id, session_id, energy, mood, focus, auto, created_at").limit(1000)
    ]);

  res.status(200).json({
    exportedAt: new Date().toISOString(),
    profiles: profiles ?? [],
    user_state: userStates ?? [],
    journey_maps: maps ?? [],
    journey_events: events ?? [],
    daily_pulse_logs: pulseLogs ?? []
  });
}

async function handleUserState(client: SupabaseClient, req: RequestLike, res: JsonResponder) {
  const deviceToken = String(req.query?.deviceToken ?? "");
  const ownerId = String(req.query?.ownerId ?? "");
  const limit = safeLimit(req.query?.limit, 50, 500);

  if (deviceToken || ownerId) {
    const query = client
      .from("user_state")
      .select("device_token, owner_id, data, updated_at")
      .limit(1);
    const { data, error } = deviceToken
      ? await query.eq("device_token", deviceToken).maybeSingle()
      : await query.eq("owner_id", ownerId).maybeSingle();
    if (error || !data) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.status(200).json({
      deviceToken: data.device_token,
      ownerId: data.owner_id,
      updatedAt: data.updated_at,
      data: data.data ?? {}
    });
    return;
  }

  const { data, error } = await client
    .from("user_state")
    .select("device_token, owner_id, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    res.status(500).json({ error: "Failed to fetch user state" });
    return;
  }

  res.status(200).json({ rows: data });
}

async function handleUserStateExport(client: SupabaseClient, req: RequestLike, res: JsonResponder) {
  const limit = safeLimit(req.query?.limit, 200, 2000);
  const { data, error } = await client
    .from("user_state")
    .select("device_token, owner_id, data, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    res.status(500).json({ error: "Failed to export user state" });
    return;
  }

  res.status(200).json({
    exportedAt: new Date().toISOString(),
    count: data.length,
    rows: data
  });
}

async function handleUserStateImport(client: SupabaseClient, req: RequestLike, res: JsonResponder) {
  const body = await parseJsonBody(req);
  const rows: UserStateImportRow[] = Array.isArray(body?.rows)
    ? (body.rows as UserStateImportRow[])
    : Array.isArray(body)
      ? (body as UserStateImportRow[])
      : [];
  if (rows.length === 0) {
    res.status(400).json({ error: "No rows provided" });
    return;
  }

  const payload = rows
    .filter((row) => row && typeof row === "object" && row.device_token && row.data)
    .map((row) => ({
      device_token: row.device_token,
      owner_id: row.owner_id ?? null,
      data: row.data,
      updated_at: row.updated_at ?? new Date().toISOString()
    }));

  if (payload.length === 0) {
    res.status(400).json({ error: "Invalid rows" });
    return;
  }

  const { error } = await client.from("user_state").upsert(payload, { onConflict: "device_token" });
  if (error) {
    res.status(500).json({ error: "Failed to import user state" });
    return;
  }

  res.status(200).json({ ok: true, count: payload.length });
}

async function verifyCronOrOwner(req: RequestLike, res: JsonResponder): Promise<boolean> {
  if (verifyCron(req)) return true;
  return verifyAdminWithRoles(req, res, ["owner", "superadmin"]);
}

async function handleCronReport(req: RequestLike, res: JsonResponder) {
  if (!(await verifyCronOrOwner(req, res))) {
    if (!res.headersSent) {
      res.status(401).json({ error: "Unauthorized" });
    }
    return;
  }

  const client = getAdminSupabase();
  if (!client) {
    res.status(503).json({ error: "Supabase not configured" });
    return;
  }

  const method = String(req.method ?? "GET").toUpperCase();
  const body = method === "POST" ? await parseJsonBody(req) : {};
  const period = normalizeReportPeriod(
    req.query?.period ?? req.query?.type ?? body?.period ?? body?.type ?? "daily"
  );
  if (!period) {
    res.status(400).json({ error: "INVALID_REPORT_PERIOD" });
    return;
  }

  const reportReq = {
    ...req,
    query: {
      ...(req.query ?? {}),
      period,
      store: "1"
    }
  };
  let report: unknown = null;
  let reportStatus = 200;
  const reportRes: JsonResponder = {
    status: (s: number) => {
      reportStatus = s;
      return reportRes;
    },
    json: (data: unknown) => {
      report = data;
      return reportRes;
    }
  };
  if (period === "weekly") {
    await handleWeeklyReport(client, reportReq, reportRes);
  } else {
    await handleDailyReport(client, reportReq, reportRes);
  }
  if (reportStatus !== 200 || !report) {
    res.status(500).json({ error: "Failed to generate report" });
    return;
  }

  const reportObj = (report ?? {}) as Record<string, unknown>;
  const reportGate7 = (reportObj.gate7 ?? {}) as Record<string, unknown>;
  const reportAffiliate = (reportObj.affiliate ?? {}) as Record<string, unknown>;
  const reportConsciousRevenue = (reportObj.consciousRevenue ?? {}) as Record<string, unknown>;
  const gate7Critical = period === "weekly" && String(reportGate7.status ?? "").toLowerCase() === "critical";
  const title = gate7Critical
    ? "CRITICAL Weekly Report - Al-Rehla"
    : period === "weekly"
      ? "Weekly Report - Al-Rehla"
      : "Daily Report - Al-Rehla";
  const gate7Summary =
    period === "weekly"
      ? `\nGate-7: ${String(reportGate7.status ?? "unknown").toUpperCase()} ` +
        `(path_started_48h=${Number(reportGate7.pathStarted48h ?? 0)}, window_h=${Number(reportGate7.windowHours ?? 48)})` +
        ` | traffic_48h(events=${Number(reportGate7.trafficEvents48h ?? 0)}, sessions=${Number(reportGate7.trafficSessions48h ?? 0)})` +
        ` | baseline(events>=${Number(reportGate7.minEvents48h ?? 20)} OR sessions>=${Number(reportGate7.minSessions48h ?? 8)})` +
        ` | code=${String(reportGate7.code ?? "unknown")}`
      : "";
  const affiliateSummary =
    period === "weekly"
      ? `\nAffiliate exposed: ${Number(reportAffiliate.linkExposed ?? 0)} | clicked: ${Number(reportAffiliate.linkClicked ?? 0)} | ctr: ${Number(reportAffiliate.ctr ?? 0)}%`
      : "";
  const summary = period === "weekly"
    ? `From ${String(reportObj.from ?? "")} to ${String(reportObj.to ?? "")}\nTotal events: ${Number(reportObj.totalEvents ?? 0)}\nUnique sessions: ${Number(reportObj.uniqueSessions ?? 0)}${affiliateSummary}${gate7Summary}\nConscious alignment: ${Number(reportConsciousRevenue.alignmentScore ?? 0)}% (${String(reportConsciousRevenue.status ?? "unknown").toUpperCase()})`
    : `Date: ${String(reportObj.date ?? "")}\nTotal events: ${Number(reportObj.totalEvents ?? 0)}\nUnique sessions: ${Number(reportObj.uniqueSessions ?? 0)}`;

  await sendSlack(`${title}\n${summary}`);
  await sendResend(title, `<pre style="font-family: monospace">${summary}</pre>`);

  res.status(200).json({
    ok: true,
    period,
    generatedAt: new Date().toISOString(),
    reportGeneratedAt:
      period === "weekly"
        ? reportObj.to ?? null
        : reportObj.date ?? null
  });
}

export async function overviewRouter(req: RequestLike, res: JsonResponder) {
  initServerMonitoring();
  const reqStart = Date.now();
  overviewRuntimeStats.requests += 1;
  const method = String(req.method ?? "GET").toUpperCase();
  const kind = String(req.query?.kind ?? "overview");

  try {
    if (kind === "cron-report") {
      if (method !== "GET" && method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }
      await handleCronReport(req, res);
      return;
    }

    const isSensitive =
      kind === "full-export" || kind === "user-state-export" || kind === "user-state-import";
    const authorized = isSensitive
      ? await verifyAdminWithRoles(req, res, ["owner", "superadmin"])
      : await verifyAdmin(req, res);
    if (!authorized) return;

    const client = getAdminSupabase();
    if (!client) {
      res.status(503).json({ error: "Supabase not configured" });
      return;
    }

    if (method === "GET") {
      if (kind === "overview") return handleOverview(client, res);
      if (kind === "ops-insights") return handleOpsInsights(client, res);
      if (kind === "executive-report") return handleExecutiveReport(client, res);
      if (kind === "system-health") return handleSystemHealth(client, res);
      if (kind === "security-signals") return handleSecuritySignals(client, res);
      if (kind === "owner-ops") return handleOwnerOps(client, req, res);
      if (kind === "feedback") return handleFeedback(client, req, res);
      if (kind === "support-tickets") return handleSupportTicketsGet(client, req, res);
      if (kind === "owner-alerts") return handleOwnerAlerts(client, req, res);
      if (kind === "daily-report") return handleDailyReport(client, req, res);
      if (kind === "weekly-report") return handleWeeklyReport(client, req, res);
      if (kind === "full-export") return handleFullExport(client, req, res);
      if (kind === "user-state") return handleUserState(client, req, res);
      if (kind === "user-state-export") return handleUserStateExport(client, req, res);
      res.status(400).json({ error: `Unsupported kind for GET: ${kind}` });
      return;
    }

    if (method === "POST") {
      if (kind === "support-tickets") return handleSupportTicketsPost(client, req, res);
      if (kind === "user-state-import") return handleUserStateImport(client, req, res);
      res.status(400).json({ error: `Unsupported kind for POST: ${kind}` });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    overviewRuntimeStats.errors += 1;
    overviewRuntimeStats.lastErrorAt = Date.now();
    captureServerError(error, { kind, method, area: "overviewRouter" });
    await recordAdminAudit(req, "admin_api_error", { kind, method, message: (error as Error)?.message ?? "unknown" });
    res.status(500).json({ error: "Internal server error" });
  } finally {
    pushLatencySample(Date.now() - reqStart);
  }
}
