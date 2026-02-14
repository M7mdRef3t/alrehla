import { getAdminSupabase, parseJsonBody, recordAdminAudit, verifyAdmin, verifyAdminWithRoles } from "./_shared.js";

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

function safeLimit(raw: unknown, fallback: number, max = 5000): number {
  const value = Number(raw);
  if (Number.isNaN(value) || value <= 0) return fallback;
  return Math.min(value, max);
}

function verifyCron(req: any): boolean {
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
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REPORT_EMAIL_TO;
  const from = process.env.REPORT_EMAIL_FROM;
  if (!apiKey || !to || !from) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html
    })
  });
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

async function handleOverview(client: any, res: any) {
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
    { data: installedSessionsRows }
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
    }
  });
}

async function handleFeedback(client: any, req: any, res: any) {
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

async function handleOwnerAlerts(client: any, req: any, res: any) {
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

async function handleOpsInsights(client: any, res: any) {
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

async function handleExecutiveReport(client: any, res: any) {
  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: flowRows }, { count: events24h }, { count: pathStarted24h }, { count: nodesAdded24h }, { count: mapsTotal }] =
    await Promise.all([
      client
        .from("journey_events")
        .select("payload,session_id,created_at")
        .eq("type", "flow_event")
        .gte("created_at", since30d)
        .order("created_at", { ascending: false })
        .limit(20000),
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
    recommendedActions
  });
}

async function handleSystemHealth(client: any, res: any) {
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

async function handleDailyReport(client: any, req: any, res: any) {
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

async function handleWeeklyReport(client: any, req: any, res: any) {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

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
  const typeCounts: Record<string, number> = {};
  let totalEvents = 0;

  for (const row of (events ?? []) as Array<Record<string, unknown>>) {
    const createdAt = new Date(String(row.created_at ?? now));
    const day = toDateOnly(createdAt);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
    const sessionId = String(row.session_id ?? "anonymous");
    bySession.set(sessionId, (bySession.get(sessionId) ?? 0) + 1);
    const type = String(row.type ?? "");
    typeCounts[type] = (typeCounts[type] ?? 0) + 1;
    totalEvents += 1;
  }

  const topSessions = Array.from(bySession.entries())
    .map(([sessionId, total]) => ({ sessionId, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const dailySeries = Array.from(byDay.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const report = {
    from: toDateOnly(start),
    to: toDateOnly(end),
    totalEvents,
    uniqueSessions: bySession.size,
    typeCounts,
    dailySeries,
    topSessions
  };

  if (String(req.query?.store ?? "") === "1") {
    await client.from("admin_reports").insert({
      kind: "weekly",
      payload: report
    });
  }

  res.status(200).json(report);
}

async function handleFullExport(client: any, req: any, res: any) {
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

async function handleUserState(client: any, req: any, res: any) {
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

async function handleUserStateExport(client: any, req: any, res: any) {
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

async function handleUserStateImport(client: any, req: any, res: any) {
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

async function handleCronReport(req: any, res: any) {
  if (!verifyCron(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const period = String(req.query?.period ?? "daily");
  const reportKind = period === "weekly" ? "weekly-report" : "daily-report";
  const endpoint = `/api/admin/overview?kind=${reportKind}&store=1`;

  const baseUrl = process.env.PUBLIC_APP_URL || process.env.VERCEL_URL || "";
  const host = req.headers?.host;
  const proto = req.headers?.["x-forwarded-proto"] || "https";
  const derived = host ? `${proto}://${host}` : "";
  const normalized = baseUrl
    ? (baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`)
    : derived;

  if (!normalized) {
    res.status(500).json({ error: "PUBLIC_APP_URL not set" });
    return;
  }
  if (!process.env.ADMIN_API_SECRET) {
    res.status(500).json({ error: "ADMIN_API_SECRET not set" });
    return;
  }

  const reportRes = await fetch(`${normalized}${endpoint}`, {
    headers: {
      "x-admin-code": process.env.ADMIN_API_SECRET
    }
  });
  if (!reportRes.ok) {
    res.status(500).json({ error: "Failed to generate report" });
    return;
  }
  const report = await reportRes.json();

  const title = period === "weekly" ? "Weekly Report - Al-Rehla" : "Daily Report - Al-Rehla";
  const summary = period === "weekly"
    ? `From ${report.from} to ${report.to}\nTotal events: ${report.totalEvents}\nUnique sessions: ${report.uniqueSessions}`
    : `Date: ${report.date}\nTotal events: ${report.totalEvents}\nUnique sessions: ${report.uniqueSessions}`;

  await sendSlack(`${title}\n${summary}`);
  await sendResend(title, `<pre style="font-family: monospace">${summary}</pre>`);

  res.status(200).json({ ok: true, period });
}

export async function overviewRouter(req: any, res: any) {
  const reqStart = Date.now();
  overviewRuntimeStats.requests += 1;
  const method = String(req.method ?? "GET").toUpperCase();
  const kind = String(req.query?.kind ?? "overview");

  try {
    if (kind === "cron-report") {
      if (method !== "GET") {
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
      if (kind === "feedback") return handleFeedback(client, req, res);
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
      if (kind === "user-state-import") return handleUserStateImport(client, req, res);
      res.status(400).json({ error: `Unsupported kind for POST: ${kind}` });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    overviewRuntimeStats.errors += 1;
    overviewRuntimeStats.lastErrorAt = Date.now();
    await recordAdminAudit(req, "admin_api_error", { kind, method, message: (error as Error)?.message ?? "unknown" });
    res.status(500).json({ error: "Internal server error" });
  } finally {
    pushLatencySample(Date.now() - reqStart);
  }
}
