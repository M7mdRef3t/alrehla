import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

function loadLocalEnv() {
  if (!fs.existsSync(".env.local")) return;
  const raw = fs.readFileSync(".env.local", "utf8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i <= 0) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim();
    if (k && process.env[k] == null) process.env[k] = v;
  }
}

loadLocalEnv();

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

function sessionId(prefix, i) {
  return `${prefix}_${String(i).padStart(4, "0")}`;
}

function buildTask(pathId, taskId, taskLabel) {
  return { pathId, taskId, taskLabel };
}

const GOLDEN_SEQUENCE = [
  buildTask("path_protection", "p1_boundary_reset", "حد إعادة الضبط"),
  buildTask("path_protection", "p1_message_template", "قالب الرسالة الهادئة"),
  buildTask("path_protection", "p1_exposure_block", "إغلاق نافذة الاستنزاف")
];

const DRAIN_SEQUENCE = [
  buildTask("path_detox", "d1_thought_cut", "قطع الاستحضار"),
  buildTask("path_detox", "d1_guilt_reframe", "إعادة تأطير الذنب"),
  buildTask("path_detox", "d1_cognitive_silence", "صمت إدراكي")
];

const OLD_SEQUENCE = [
  buildTask("path_negotiation", "n1_soft_boundary", "حد ناعم"),
  buildTask("path_negotiation", "n1_repair_phrase", "جملة إصلاح"),
  buildTask("path_negotiation", "n1_micro_agreement", "اتفاق صغير")
];

const NEW_SEQUENCE = [
  buildTask("path_deepening", "g1_gratitude_anchor", "مرساة الامتنان"),
  buildTask("path_deepening", "g1_secure_checkin", "تشيك-إن آمن"),
  buildTask("path_deepening", "g1_trust_loop", "حلقة الثقة")
];

function pushEvent(rows, session, type, payload, createdAt) {
  rows.push({
    session_id: session,
    mode: "identified",
    type,
    payload,
    created_at: new Date(createdAt).toISOString()
  });
}

function generateGoldenRows(count = 84) {
  const rows = [];
  for (let i = 1; i <= count; i += 1) {
    const sid = sessionId("synthetic_golden", i);
    let t = now - (Math.floor(Math.random() * 5) + 1) * DAY;
    for (const task of GOLDEN_SEQUENCE) {
      const latencyMin = 2 + Math.floor(Math.random() * 4); // 2-5 minutes
      pushEvent(rows, sid, "task_started", task, t);
      t += latencyMin * 60 * 1000;
      pushEvent(rows, sid, "task_completed", task, t);
      t += (2 + Math.floor(Math.random() * 8)) * 60 * 1000;
    }
  }
  return rows;
}

function generateDrainRows(count = 18) {
  const rows = [];
  for (let i = 1; i <= count; i += 1) {
    const sid = sessionId("synthetic_drain", i);
    let t = now - (Math.floor(Math.random() * 4) + 1) * DAY;
    for (let idx = 0; idx < DRAIN_SEQUENCE.length; idx += 1) {
      const task = DRAIN_SEQUENCE[idx];
      const latencyMin = 25 + Math.floor(Math.random() * 55); // 25-79 minutes
      pushEvent(rows, sid, "task_started", task, t);
      const shouldDrop = idx >= 1 && Math.random() < 0.6;
      if (!shouldDrop) {
        t += latencyMin * 60 * 1000;
        pushEvent(rows, sid, "task_completed", task, t);
      } else {
        t += (5 + Math.floor(Math.random() * 12)) * 60 * 1000;
      }
      t += (8 + Math.floor(Math.random() * 20)) * 60 * 1000;
    }
  }
  return rows;
}

function generateDecayRows(oldCount = 12, newCount = 6) {
  const rows = [];
  // Old successful trend (about 30 days ago)
  for (let i = 1; i <= oldCount; i += 1) {
    const sid = sessionId("synthetic_oldtrend", i);
    let t = now - (28 + Math.floor(Math.random() * 5)) * DAY;
    for (const task of OLD_SEQUENCE) {
      pushEvent(rows, sid, "task_started", task, t);
      t += (3 + Math.floor(Math.random() * 5)) * 60 * 1000;
      pushEvent(rows, sid, "task_completed", task, t);
      t += (3 + Math.floor(Math.random() * 10)) * 60 * 1000;
    }
  }
  // New recent trend (last 2 days)
  for (let i = 1; i <= newCount; i += 1) {
    const sid = sessionId("synthetic_newtrend", i);
    let t = now - (1 + Math.floor(Math.random() * 2)) * DAY;
    for (const task of NEW_SEQUENCE) {
      pushEvent(rows, sid, "task_started", task, t);
      t += (4 + Math.floor(Math.random() * 8)) * 60 * 1000;
      pushEvent(rows, sid, "task_completed", task, t);
      t += (2 + Math.floor(Math.random() * 8)) * 60 * 1000;
    }
  }
  return rows;
}

async function insertInChunks(rows, size = 500) {
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    const { error } = await supabase.from("journey_events").insert(chunk);
    if (error) throw error;
  }
}

async function main() {
  const rows = [
    ...generateGoldenRows(),
    ...generateDrainRows(),
    ...generateDecayRows()
  ].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));

  const summary = {
    totalEvents: rows.length,
    sessions: new Set(rows.map((r) => r.session_id)).size,
    started: rows.filter((r) => r.type === "task_started").length,
    completed: rows.filter((r) => r.type === "task_completed").length,
    personas: {
      golden: rows.filter((r) => String(r.session_id).startsWith("synthetic_golden")).length,
      drain: rows.filter((r) => String(r.session_id).startsWith("synthetic_drain")).length,
      oldTrend: rows.filter((r) => String(r.session_id).startsWith("synthetic_oldtrend")).length,
      newTrend: rows.filter((r) => String(r.session_id).startsWith("synthetic_newtrend")).length
    }
  };

  if (!APPLY) {
    console.log("Dry run only. Use --apply to insert rows.");
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  await insertInChunks(rows);
  console.log("Inserted synthetic journey_events.");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error("generate-synthetic-swarm failed:", err?.message || err);
  process.exit(1);
});
