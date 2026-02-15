import fs from "fs/promises";
import path from "path";
import process from "process";

const DAY = 24 * 60 * 60 * 1000;

function env(name) {
  return process.env[name] || "";
}

function isoSince(days) {
  return new Date(Date.now() - days * DAY).toISOString();
}

async function fetchJson(base, key, query) {
  const res = await fetch(`${base}${query}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });
  if (!res.ok) {
    throw new Error(`Supabase query failed ${res.status} for ${query}`);
  }
  return res.json();
}

async function fetchCount(base, key, query) {
  const res = await fetch(`${base}${query}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "count=exact",
      Range: "0-0"
    }
  });
  if (!res.ok) {
    throw new Error(`Supabase count failed ${res.status} for ${query}`);
  }
  const contentRange = res.headers.get("content-range") || "";
  const match = contentRange.match(/\/(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function pct(num, den) {
  if (!den) return 0;
  return Math.round((num / den) * 100);
}

function formatRows(rows) {
  if (!rows.length) return "- لا توجد بيانات";
  return rows.map((r) => `- ${r}`).join("\n");
}

async function main() {
  const supabaseUrl = env("VITE_SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const base = `${supabaseUrl}/rest/v1`;
  const since1d = encodeURIComponent(isoSince(1));
  const since7d = encodeURIComponent(isoSince(7));
  const since30d = encodeURIComponent(isoSince(30));

  const [
    profiles,
    userState,
    eventsTotal,
    mapsTotal,
    events1d,
    events7d,
    events30d,
    nodeAdded,
    pathStarted,
    taskCompleted,
    identified,
    anonymous,
    flowEvents30d,
    emergencyRows
  ] = await Promise.all([
    fetchCount(base, serviceKey, "/profiles?select=id"),
    fetchCount(base, serviceKey, "/user_state?select=device_token"),
    fetchCount(base, serviceKey, "/journey_events?select=id"),
    fetchCount(base, serviceKey, "/journey_maps?select=session_id"),
    fetchCount(base, serviceKey, `/journey_events?select=id&created_at=gte.${since1d}`),
    fetchCount(base, serviceKey, `/journey_events?select=id&created_at=gte.${since7d}`),
    fetchCount(base, serviceKey, `/journey_events?select=id&created_at=gte.${since30d}`),
    fetchCount(base, serviceKey, "/journey_events?select=id&type=eq.node_added"),
    fetchCount(base, serviceKey, "/journey_events?select=id&type=eq.path_started"),
    fetchCount(base, serviceKey, "/journey_events?select=id&type=eq.task_completed"),
    fetchCount(base, serviceKey, "/journey_events?select=id&mode=eq.identified"),
    fetchCount(base, serviceKey, "/journey_events?select=id&mode=eq.anonymous"),
    fetchJson(
      base,
      serviceKey,
      `/journey_events?select=payload,created_at,session_id&type=eq.flow_event&created_at=gte.${since30d}&order=created_at.desc&limit=10000`
    ),
    fetchJson(
      base,
      serviceKey,
      "/journey_events?select=session_id,payload,created_at&type=eq.node_added&order=created_at.desc&limit=2000"
    )
  ]);

  const flowCounts = {};
  const sessions30d = new Set();
  const pulseAbandonByReason = { backdrop: 0, close_button: 0, programmatic: 0, browser_close: 0, unknown: 0 };
  for (const row of flowEvents30d) {
    const step = row?.payload?.step;
    if (typeof step !== "string") continue;
    flowCounts[step] = (flowCounts[step] || 0) + 1;
    if (row?.session_id) sessions30d.add(row.session_id);
    if (step === "pulse_abandoned") {
      const reason = row?.payload?.extra?.closeReason;
      pulseAbandonByReason[reason] = (pulseAbandonByReason[reason] || 0) + 1;
    }
  }

  const emergency = emergencyRows
    .filter((r) => r?.payload?.isEmergency === true)
    .slice(0, 5)
    .map((r) => ({
      sessionId: r.session_id || "",
      personLabel: r?.payload?.personLabel || "—",
      createdAt: r.created_at || ""
    }));

  const funnel = {
    landingViewed: flowCounts.landing_viewed || 0,
    startClicked: flowCounts.landing_clicked_start || 0,
    addPersonOpened: flowCounts.add_person_opened || 0,
    addPersonDone: flowCounts.add_person_done_show_on_map || 0,
    startPathCTA: flowCounts.add_person_start_path_clicked || 0
  };

  const warnings = [];
  if (mapsTotal === 0 && nodeAdded > 0) warnings.push("تمت إضافات أشخاص لكن لا توجد خرائط محفوظة.");
  if (pathStarted === 0) warnings.push("لا توجد أي بدايات مسار.");
  if (funnel.addPersonOpened > 0 && pct(funnel.addPersonDone, funnel.addPersonOpened) < 30) {
    warnings.push("تحويل ما بعد إضافة الشخص منخفض جدًا.");
  }
  if (pct(identified, identified + anonymous) < 25) warnings.push("نسبة identified منخفضة وتضعف التتبع الفردي.");

  const insights = {
    generatedAt: new Date().toISOString(),
    totals: { profiles, userState, eventsTotal, mapsTotal, sessions30d: sessions30d.size },
    activity: { events1d, events7d, events30d },
    journey: { nodeAdded, pathStarted, taskCompleted },
    tracking: {
      identified,
      anonymous,
      identifiedRate: pct(identified, identified + anonymous)
    },
    funnel,
    funnelRates: {
      startClickRate: pct(funnel.startClicked, funnel.landingViewed),
      addPersonRateFromStart: pct(funnel.addPersonOpened, funnel.startClicked),
      addPersonDoneRate: pct(funnel.addPersonDone, funnel.addPersonOpened),
      startPathCtaRate: pct(funnel.startPathCTA, funnel.addPersonDone)
    },
    pulseAbandonByReason,
    emergency,
    warnings
  };

  const recommendations = [
    "ثبّت CTA واحد بعد الإضافة: ابدأ المسار الآن.",
    "راجع حفظ الخرائط إذا بقي mapsTotal=0 مع nodeAdded>0.",
    "راقب KPI الجديد add_person_start_path_clicked يوميًا.",
    "ارفع identified rate لضمان جودة التتبع."
  ];

  const lines = [
    `# Production Insights`,
    ``,
    `- Generated: ${insights.generatedAt}`,
    ``,
    `## Totals`,
    `- Profiles: ${profiles}`,
    `- User state rows: ${userState}`,
    `- Journey events: ${eventsTotal}`,
    `- Journey maps: ${mapsTotal}`,
    `- Distinct sessions (30d sample): ${sessions30d.size}`,
    ``,
    `## Activity`,
    `- Events 24h: ${events1d}`,
    `- Events 7d: ${events7d}`,
    `- Events 30d: ${events30d}`,
    ``,
    `## Funnel`,
    `- landing_viewed: ${funnel.landingViewed}`,
    `- landing_clicked_start: ${funnel.startClicked} (${insights.funnelRates.startClickRate}%)`,
    `- add_person_opened: ${funnel.addPersonOpened} (${insights.funnelRates.addPersonRateFromStart}%)`,
    `- add_person_done_show_on_map: ${funnel.addPersonDone} (${insights.funnelRates.addPersonDoneRate}%)`,
    `- add_person_start_path_clicked: ${funnel.startPathCTA} (${insights.funnelRates.startPathCtaRate}%)`,
    ``,
    `## Journey`,
    `- node_added: ${nodeAdded}`,
    `- path_started: ${pathStarted}`,
    `- task_completed: ${taskCompleted}`,
    ``,
    `## Tracking Quality`,
    `- identified: ${identified}`,
    `- anonymous: ${anonymous}`,
    `- identified rate: ${insights.tracking.identifiedRate}%`,
    ``,
    `## Pulse Abandon`,
    formatRows(
      Object.entries(pulseAbandonByReason).map(([k, v]) => `${k}: ${v}`)
    ),
    ``,
    `## Emergency (Latest 5)`,
    formatRows(emergency.map((e) => `${e.personLabel} | ${e.createdAt} | ${e.sessionId || "no-session"}`)),
    ``,
    `## Warnings`,
    formatRows(warnings.length ? warnings : ["لا توجد تحذيرات حرجة حاليًا."]),
    ``,
    `## Recommendations`,
    formatRows(recommendations)
  ];

  const outDir = path.join(process.cwd(), "reports");
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, "production-insights.json"), JSON.stringify(insights, null, 2));
  await fs.writeFile(path.join(outDir, "production-insights.md"), `${lines.join("\n")}\n`);

  console.log("Generated reports/production-insights.json");
  console.log("Generated reports/production-insights.md");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

