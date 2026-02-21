const BASE_URL = String(process.env.ROUTING_LOAD_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const TOTAL_REQUESTS = Number.parseInt(process.env.ROUTING_LOAD_TOTAL ?? "5000", 10);
const CONCURRENCY = Number.parseInt(process.env.ROUTING_LOAD_CONCURRENCY ?? "250", 10);
const INTERVENTION_RATE = Number.parseFloat(process.env.ROUTING_LOAD_INTERVENTION_RATE ?? "0.2");
const TIMEOUT_MS = Number.parseInt(process.env.ROUTING_LOAD_TIMEOUT_MS ?? "15000", 10);

if (!Number.isFinite(TOTAL_REQUESTS) || TOTAL_REQUESTS <= 0) {
  console.error("Invalid ROUTING_LOAD_TOTAL");
  process.exit(2);
}
if (!Number.isFinite(CONCURRENCY) || CONCURRENCY <= 0) {
  console.error("Invalid ROUTING_LOAD_CONCURRENCY");
  process.exit(2);
}
if (!Number.isFinite(INTERVENTION_RATE) || INTERVENTION_RATE < 0 || INTERVENTION_RATE > 1) {
  console.error("Invalid ROUTING_LOAD_INTERVENTION_RATE");
  process.exit(2);
}

function randomId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function choose(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildNextStepPayload(index) {
  const rings = ["green", "yellow", "red", "mixed"];
  const phase = choose(["mapping", "awareness", "resistance", "acceptance", "integration"]);
  const riskRatio = Math.random();
  const hesitation = Math.random();
  const pulseInstability = Math.random();
  const taskCompletion7d = Math.random();
  const contentId = "00000000-0000-0000-0000-000000000000";
  const edgeId = `edge_stress_${index % 25}`;

  return {
    sessionId: `load_sess_${index % 1000}`,
    surface: index % 2 === 0 ? "map" : "tools",
    phase,
    features: {
      riskRatio,
      pulseInstability7d: pulseInstability,
      sessionHesitation: hesitation,
      taskCompletion7d,
      dominantRing: choose(rings),
      focusNodeId: `node_${index % 64}`
    },
    recentTelemetry: [
      { hesitationSec: Math.round(Math.random() * 8), activeElapsedSec: Math.round(20 + Math.random() * 60) },
      { hesitationSec: Math.round(Math.random() * 10), activeElapsedSec: Math.round(25 + Math.random() * 80) },
      { hesitationSec: Math.round(Math.random() * 12), activeElapsedSec: Math.round(25 + Math.random() * 90) }
    ],
    candidates: [
      {
        id: `cand_${index}_a`,
        title: "تنفس قصير",
        message: "خذ 30 ثانية تهدئة",
        cta: "ابدأ الآن",
        actionType: "open_breathing",
        actionPayload: { edgeId, contentId, cognitiveLoadRequired: 1 },
        tags: ["breathing", "stabilize"]
      },
      {
        id: `cand_${index}_b`,
        title: "مهمة خطوة واحدة",
        message: "نفذ خطوة خفيفة ثم ارجع",
        cta: "ابدأ المهمة",
        actionType: "open_mission",
        actionPayload: { edgeId, contentId, cognitiveLoadRequired: 4 },
        tags: ["mission", "focus"]
      }
    ],
    availableFeatures: {
      dynamic_routing_v2: true
    }
  };
}

async function postJson(path, payload, stats) {
  const url = `${BASE_URL}${path}`;
  const started = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const ms = performance.now() - started;
    stats.latencies.push(ms);
    stats.statuses[response.status] = (stats.statuses[response.status] ?? 0) + 1;
    let json = null;
    try {
      json = await response.json();
    } catch {
      json = null;
    }
    if (!response.ok) {
      stats.errors += 1;
      return { ok: false, status: response.status, json };
    }
    return { ok: true, status: response.status, json };
  } catch (error) {
    const ms = performance.now() - started;
    stats.latencies.push(ms);
    stats.errors += 1;
    stats.statuses["network_error"] = (stats.statuses["network_error"] ?? 0) + 1;
    return { ok: false, status: 0, json: { error: String(error) } };
  } finally {
    clearTimeout(timeout);
  }
}

function makeStats() {
  return {
    started: 0,
    done: 0,
    errors: 0,
    latencies: [],
    statuses: {}
  };
}

async function runSingle(index, stats) {
  stats.next.started += 1;
  const nextPayload = buildNextStepPayload(index);
  const nextRes = await postJson("/api/routing/next-step-v2", nextPayload, stats.next);
  stats.next.done += 1;
  if (!nextRes.ok) return;

  const decisionId = String(nextRes.json?.decisionId ?? "");
  if (!decisionId) return;

  stats.outcome.started += 1;
  const outcomeRes = await postJson(
    "/api/routing/outcome-v2",
    {
      decisionId,
      sessionId: nextPayload.sessionId,
      acted: true,
      completed: Math.random() > 0.28,
      completionLatencySec: Math.round(20 + Math.random() * 240),
      hesitationSec: Math.round(Math.random() * 14),
      idleTimeSec: Math.round(Math.random() * 10),
      rawElapsedSec: Math.round(30 + Math.random() * 260),
      interactionCount: Math.round(1 + Math.random() * 6)
    },
    stats.outcome
  );
  stats.outcome.done += 1;
  if (!outcomeRes.ok) return;

  if (Math.random() <= INTERVENTION_RATE) {
    stats.intervention.started += 1;
    await postJson(
      "/api/routing/intervention-trigger",
      {
        decisionId,
        sessionId: nextPayload.sessionId,
        hesitationSec: Math.round(120 + Math.random() * 60),
        cognitiveLoadRequired: 4,
        actionType: "open_mission",
        surface: nextPayload.surface
      },
      stats.intervention
    );
    stats.intervention.done += 1;
  }
}

async function runLoad() {
  const startedAt = Date.now();
  const stats = {
    next: makeStats(),
    outcome: makeStats(),
    intervention: makeStats()
  };

  console.log("[routing-load-test] Config");
  console.log(
    JSON.stringify(
      {
        baseUrl: BASE_URL,
        totalRequests: TOTAL_REQUESTS,
        concurrency: CONCURRENCY,
        interventionRate: INTERVENTION_RATE,
        timeoutMs: TIMEOUT_MS
      },
      null,
      2
    )
  );

  let cursor = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, TOTAL_REQUESTS) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= TOTAL_REQUESTS) break;
      await runSingle(index, stats);
    }
  });
  await Promise.all(workers);

  const totalMs = Date.now() - startedAt;
  const printBlock = (name, value) => {
    const count = value.latencies.length;
    const avg = count > 0 ? value.latencies.reduce((s, n) => s + n, 0) / count : 0;
    const p95 = percentile(value.latencies, 95);
    const p99 = percentile(value.latencies, 99);
    console.log(`\n[${name}]`);
    console.log(
      JSON.stringify(
        {
          started: value.started,
          done: value.done,
          errors: value.errors,
          avgMs: Number(avg.toFixed(2)),
          p95Ms: Number(p95.toFixed(2)),
          p99Ms: Number(p99.toFixed(2)),
          statuses: value.statuses
        },
        null,
        2
      )
    );
  };

  console.log(`\n[routing-load-test] totalDurationMs=${totalMs}`);
  printBlock("next-step-v2", stats.next);
  printBlock("outcome-v2", stats.outcome);
  printBlock("intervention-trigger", stats.intervention);
}

runLoad().catch((error) => {
  console.error("[routing-load-test] fatal", error);
  process.exit(1);
});

