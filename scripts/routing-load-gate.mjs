const BASE_URL = String(process.env.ROUTING_LOAD_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const TOTAL_REQUESTS = Number.parseInt(process.env.ROUTING_LOAD_TOTAL ?? "2000", 10);
const CONCURRENCY = Number.parseInt(process.env.ROUTING_LOAD_CONCURRENCY ?? "200", 10);
const INTERVENTION_RATE = Number.parseFloat(process.env.ROUTING_LOAD_INTERVENTION_RATE ?? "0.2");
const TIMEOUT_MS = Number.parseInt(process.env.ROUTING_LOAD_TIMEOUT_MS ?? "15000", 10);

const GATE_MAX_ERROR_RATE_PCT = Number.parseFloat(process.env.ROUTING_GATE_MAX_ERROR_RATE_PCT ?? "2");
const GATE_MAX_P95_NEXT_MS = Number.parseFloat(process.env.ROUTING_GATE_MAX_P95_NEXT_MS ?? "900");
const GATE_MAX_P95_OUTCOME_MS = Number.parseFloat(process.env.ROUTING_GATE_MAX_P95_OUTCOME_MS ?? "700");
const GATE_MAX_P95_INTERVENTION_MS = Number.parseFloat(process.env.ROUTING_GATE_MAX_P95_INTERVENTION_MS ?? "700");
const GATE_MIN_SUCCESS_NEXT = Number.parseInt(process.env.ROUTING_GATE_MIN_SUCCESS_NEXT ?? String(TOTAL_REQUESTS), 10);
const GATE_MIN_SUCCESS_OUTCOME = Number.parseInt(
  process.env.ROUTING_GATE_MIN_SUCCESS_OUTCOME ?? String(Math.floor(TOTAL_REQUESTS * 0.9)),
  10
);

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function choose(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeStats() {
  return { started: 0, done: 0, errors: 0, latencies: [], statuses: {} };
}

function buildNextStepPayload(index) {
  const rings = ["green", "yellow", "red", "mixed"];
  return {
    sessionId: `gate_sess_${index % 2000}`,
    surface: index % 2 === 0 ? "map" : "tools",
    phase: choose(["mapping", "awareness", "resistance", "acceptance"]),
    features: {
      riskRatio: Math.random(),
      pulseInstability7d: Math.random(),
      sessionHesitation: Math.random(),
      taskCompletion7d: Math.random(),
      dominantRing: choose(rings),
      focusNodeId: `node_${index % 64}`
    },
    recentTelemetry: [
      { hesitationSec: Math.round(Math.random() * 8), activeElapsedSec: Math.round(20 + Math.random() * 50) },
      { hesitationSec: Math.round(Math.random() * 10), activeElapsedSec: Math.round(25 + Math.random() * 70) },
      { hesitationSec: Math.round(Math.random() * 12), activeElapsedSec: Math.round(30 + Math.random() * 90) }
    ],
    candidates: [
      {
        id: `gate_${index}_a`,
        title: "تنفس قصير",
        message: "تهدئة سريعة",
        cta: "ابدأ",
        actionType: "open_breathing",
        actionPayload: { edgeId: `edge_gate_${index % 20}`, cognitiveLoadRequired: 1 },
        tags: ["breathing"]
      },
      {
        id: `gate_${index}_b`,
        title: "مهمة خفيفة",
        message: "خطوة واحدة",
        cta: "ابدأ",
        actionType: "open_mission",
        actionPayload: { edgeId: `edge_gate_${index % 20}`, cognitiveLoadRequired: 4 },
        tags: ["mission"]
      }
    ],
    availableFeatures: { dynamic_routing_v2: true }
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
      return { ok: false, json };
    }
    return { ok: true, json };
  } catch {
    const ms = performance.now() - started;
    stats.latencies.push(ms);
    stats.errors += 1;
    stats.statuses.network_error = (stats.statuses.network_error ?? 0) + 1;
    return { ok: false, json: null };
  } finally {
    clearTimeout(timeout);
  }
}

async function runSingle(index, stats) {
  stats.next.started += 1;
  const nextPayload = buildNextStepPayload(index);
  const nextRes = await postJson("/api/routing/next-step-v2", nextPayload, stats.next);
  stats.next.done += 1;
  if (!nextRes.ok) return;

  const decisionId = String(nextRes.json?.decisionId ?? "");
  if (!decisionId) {
    stats.next.errors += 1;
    return;
  }

  stats.outcome.started += 1;
  const outcomeRes = await postJson(
    "/api/routing/outcome-v2",
    {
      decisionId,
      sessionId: nextPayload.sessionId,
      acted: true,
      completed: Math.random() > 0.25,
      completionLatencySec: Math.round(20 + Math.random() * 180)
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
        hesitationSec: Math.round(120 + Math.random() * 45),
        cognitiveLoadRequired: 4,
        actionType: "open_mission",
        surface: nextPayload.surface
      },
      stats.intervention
    );
    stats.intervention.done += 1;
  }
}

function summarize(stats) {
  const toBlock = (name, value) => {
    const count = value.latencies.length;
    const avg = count > 0 ? value.latencies.reduce((s, n) => s + n, 0) / count : 0;
    const p95 = percentile(value.latencies, 95);
    const errorRatePct = value.started > 0 ? (value.errors / value.started) * 100 : 0;
    return {
      name,
      started: value.started,
      done: value.done,
      errors: value.errors,
      errorRatePct: Number(errorRatePct.toFixed(2)),
      avgMs: Number(avg.toFixed(2)),
      p95Ms: Number(p95.toFixed(2)),
      statuses: value.statuses
    };
  };

  return {
    next: toBlock("next-step-v2", stats.next),
    outcome: toBlock("outcome-v2", stats.outcome),
    intervention: toBlock("intervention-trigger", stats.intervention)
  };
}

function evaluateGate(summary) {
  const failures = [];
  if (summary.next.errorRatePct > GATE_MAX_ERROR_RATE_PCT) {
    failures.push(`next-step-v2 errorRate ${summary.next.errorRatePct}% > ${GATE_MAX_ERROR_RATE_PCT}%`);
  }
  if (summary.outcome.errorRatePct > GATE_MAX_ERROR_RATE_PCT) {
    failures.push(`outcome-v2 errorRate ${summary.outcome.errorRatePct}% > ${GATE_MAX_ERROR_RATE_PCT}%`);
  }
  if (summary.intervention.started > 0 && summary.intervention.errorRatePct > GATE_MAX_ERROR_RATE_PCT) {
    failures.push(
      `intervention-trigger errorRate ${summary.intervention.errorRatePct}% > ${GATE_MAX_ERROR_RATE_PCT}%`
    );
  }
  if (summary.next.p95Ms > GATE_MAX_P95_NEXT_MS) {
    failures.push(`next-step-v2 p95 ${summary.next.p95Ms}ms > ${GATE_MAX_P95_NEXT_MS}ms`);
  }
  if (summary.outcome.p95Ms > GATE_MAX_P95_OUTCOME_MS) {
    failures.push(`outcome-v2 p95 ${summary.outcome.p95Ms}ms > ${GATE_MAX_P95_OUTCOME_MS}ms`);
  }
  if (summary.intervention.started > 0 && summary.intervention.p95Ms > GATE_MAX_P95_INTERVENTION_MS) {
    failures.push(
      `intervention-trigger p95 ${summary.intervention.p95Ms}ms > ${GATE_MAX_P95_INTERVENTION_MS}ms`
    );
  }
  if (summary.next.done - summary.next.errors < GATE_MIN_SUCCESS_NEXT) {
    failures.push(
      `next-step-v2 successful ${summary.next.done - summary.next.errors} < min ${GATE_MIN_SUCCESS_NEXT}`
    );
  }
  if (summary.outcome.started > 0 && summary.outcome.done - summary.outcome.errors < GATE_MIN_SUCCESS_OUTCOME) {
    failures.push(
      `outcome-v2 successful ${summary.outcome.done - summary.outcome.errors} < min ${GATE_MIN_SUCCESS_OUTCOME}`
    );
  }
  return failures;
}

async function main() {
  console.log("[routing-load-gate] Starting gate");
  console.log(
    JSON.stringify(
      {
        baseUrl: BASE_URL,
        totalRequests: TOTAL_REQUESTS,
        concurrency: CONCURRENCY,
        interventionRate: INTERVENTION_RATE,
        gate: {
          maxErrorRatePct: GATE_MAX_ERROR_RATE_PCT,
          maxP95NextMs: GATE_MAX_P95_NEXT_MS,
          maxP95OutcomeMs: GATE_MAX_P95_OUTCOME_MS,
          maxP95InterventionMs: GATE_MAX_P95_INTERVENTION_MS
        }
      },
      null,
      2
    )
  );

  const stats = {
    next: makeStats(),
    outcome: makeStats(),
    intervention: makeStats()
  };

  let cursor = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, TOTAL_REQUESTS) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= TOTAL_REQUESTS) break;
      await runSingle(index, stats);
    }
  });
  await Promise.all(workers);

  const summary = summarize(stats);
  console.log("[routing-load-gate] Summary");
  console.log(JSON.stringify(summary, null, 2));

  const failures = evaluateGate(summary);
  if (failures.length > 0) {
    console.error("[routing-load-gate] FAILED");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log("[routing-load-gate] PASSED");
}

main().catch((error) => {
  console.error("[routing-load-gate] fatal", error);
  process.exit(1);
});

