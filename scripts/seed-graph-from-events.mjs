import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import fs from "node:fs/promises";
import fsSync from "node:fs";

function loadLocalEnv() {
  if (!fsSync.existsSync(".env.local")) return;
  const raw = fsSync.readFileSync(".env.local", "utf8");
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
const DRY_RUN = args.has("--dry-run");
const MAX_ROWS = Number(process.env.EVENT_HYDRATION_MAX_ROWS || 200000);
const MAX_GAP_SECONDS = Number(process.env.EVENT_EDGE_MAX_GAP_SECONDS || 86400);
const MIN_SUPPORT = Number(process.env.EVENT_EDGE_MIN_SUPPORT || 1);
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || "mm2JMw1iyQiP1l0O";

function norm(value) {
  return String(value ?? "").trim();
}

function hashKey(input) {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 32);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function minutesFromLatencyMs(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return 5;
  return clamp(Math.round(ms / 60000), 1, 60);
}

function cognitiveFromLatencyMs(ms) {
  const m = minutesFromLatencyMs(ms);
  if (m <= 3) return 2;
  if (m <= 8) return 3;
  if (m <= 15) return 4;
  return 5;
}

async function insertInChunks(table, rows, chunkSize = 500) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) throw error;
  }
}

async function loadExistingContentByLegacyKey() {
  const { data } = await supabase.from("content_items").select("id,metadata").limit(100000);
  const map = new Map();
  for (const row of data ?? []) {
    const key = norm(row?.metadata?.legacy_key);
    if (key) map.set(key, String(row.id));
  }
  return map;
}

async function loadContentKnowledgeNodeByRef() {
  const { data } = await supabase
    .from("knowledge_nodes")
    .select("id,node_type,ref_id")
    .eq("node_type", "content")
    .limit(200000);
  const map = new Map();
  for (const row of data ?? []) {
    const ref = norm(row.ref_id);
    if (ref) map.set(ref, String(row.id));
  }
  return map;
}

async function loadExistingEdgeKeys() {
  const { data } = await supabase
    .from("knowledge_edges")
    .select("from_node_id,to_node_id,edge_type")
    .in("edge_type", ["prerequisite", "helps_with"])
    .limit(300000);
  const set = new Set();
  for (const row of data ?? []) {
    set.add(`${row.from_node_id}|${row.to_node_id}|${row.edge_type}`);
  }
  return set;
}

async function fetchInferredTasks() {
  const poolerRaw = (await fs.readFile("supabase/.temp/pooler-url", "utf8")).trim();
  const pooler = new URL(poolerRaw);
  pooler.password = DB_PASSWORD;
  const client = new pg.Client({ connectionString: pooler.toString(), ssl: { rejectUnauthorized: false } });
  await client.connect();
  const { rows } = await client.query("select * from public.infer_event_tasks($1)", [MAX_ROWS]);
  await client.end();
  return (rows ?? []).map((row) => ({
    taskKey: norm(row.task_key),
    pathId: norm(row.path_id || "legacy_path"),
    taskId: norm(row.task_id || "legacy_task"),
    taskLabel: norm(row.task_label || row.task_id || "Legacy Task"),
    starts: Number(row.starts ?? 0),
    completes: Number(row.completes ?? 0),
    avgLatencyMs: Number(row.avg_latency_ms ?? 300000),
    completionRate: Number(row.completion_rate ?? 0)
  }));
}

async function fetchInferredEdges() {
  const poolerRaw = (await fs.readFile("supabase/.temp/pooler-url", "utf8")).trim();
  const pooler = new URL(poolerRaw);
  pooler.password = DB_PASSWORD;
  const client = new pg.Client({ connectionString: pooler.toString(), ssl: { rejectUnauthorized: false } });
  await client.connect();
  const { rows } = await client.query(
    "select * from public.infer_event_edges($1, $2, $3)",
    [MAX_ROWS, MAX_GAP_SECONDS, MIN_SUPPORT]
  );
  await client.end();
  return (rows ?? []).map((row) => ({
    sourceTask: norm(row.source_task),
    targetTask: norm(row.target_task),
    supportCount: Number(row.support_count ?? 0),
    avgGapSeconds: Number(row.avg_gap_seconds ?? 0)
  }));
}

async function main() {
  console.log(`seed-graph-from-events start (dryRun=${DRY_RUN})`);
  const [tasks, edges] = await Promise.all([fetchInferredTasks(), fetchInferredEdges()]);

  if (tasks.length === 0) {
    console.log("No inferred tasks from event stream.");
    return;
  }

  const existingContent = await loadExistingContentByLegacyKey();
  const newContentRows = [];
  for (const task of tasks) {
    const legacyKey = hashKey(`event_task|${task.taskKey}`);
    if (existingContent.has(legacyKey)) continue;
    const estimatedMinutes = minutesFromLatencyMs(task.avgLatencyMs);
    const cognitiveLoad = cognitiveFromLatencyMs(task.avgLatencyMs);
    newContentRows.push({
      status: "active",
      title: task.taskLabel,
      content_type: "practice",
      lang: "ar",
      estimated_minutes: estimatedMinutes,
      difficulty: clamp(Math.round(1 + task.completionRate * 4), 1, 5),
      cognitive_load_required: cognitiveLoad,
      metadata: {
        legacy_key: legacyKey,
        legacy_source: "event_stream_rpc",
        task_key: task.taskKey,
        path_id: task.pathId,
        task_id: task.taskId,
        starts: task.starts,
        completes: task.completes,
        avg_latency_ms: task.avgLatencyMs,
        inferred_completion_rate: task.completionRate
      }
    });
  }

  if (DRY_RUN) {
    console.log(
      JSON.stringify(
        {
          inferredTasks: tasks.length,
          inferredEdges: edges.length,
          newContentItems: newContentRows.length
        },
        null,
        2
      )
    );
    return;
  }

  if (newContentRows.length > 0) {
    await insertInChunks("content_items", newContentRows, 300);
  }

  const refreshedContent = await loadExistingContentByLegacyKey();
  const contentNodeByRef = await loadContentKnowledgeNodeByRef();
  const missingNodes = [];
  const taskKeyToContentId = new Map();

  for (const task of tasks) {
    const legacyKey = hashKey(`event_task|${task.taskKey}`);
    const contentId = refreshedContent.get(legacyKey);
    if (!contentId) continue;
    taskKeyToContentId.set(task.taskKey, contentId);
    if (!contentNodeByRef.has(contentId)) {
      missingNodes.push({
        node_type: "content",
        ref_id: contentId,
        attributes: { seeded_from: "event_stream_rpc", task_key: task.taskKey }
      });
      contentNodeByRef.set(contentId, "__pending__");
    }
  }

  if (missingNodes.length > 0) {
    await insertInChunks("knowledge_nodes", missingNodes, 500);
  }

  const freshNodeByRef = await loadContentKnowledgeNodeByRef();
  const existingEdgeKeys = await loadExistingEdgeKeys();
  const newEdges = [];

  for (const edge of edges) {
    const fromContentId = taskKeyToContentId.get(edge.sourceTask);
    const toContentId = taskKeyToContentId.get(edge.targetTask);
    if (!fromContentId || !toContentId) continue;
    const fromNodeId = freshNodeByRef.get(fromContentId);
    const toNodeId = freshNodeByRef.get(toContentId);
    if (!fromNodeId || !toNodeId || fromNodeId === toNodeId) continue;
    const key = `${fromNodeId}|${toNodeId}|prerequisite`;
    if (existingEdgeKeys.has(key)) continue;
    newEdges.push({
      from_node_id: fromNodeId,
      to_node_id: toNodeId,
      edge_type: "prerequisite",
      base_weight: clamp(0.5 + Math.log10(1 + edge.supportCount), 0.5, 2.5),
      active: true
    });
    existingEdgeKeys.add(key);
  }

  if (newEdges.length > 0) {
    await insertInChunks("knowledge_edges", newEdges, 500);
  }

  const { data: currentEdges } = await supabase
    .from("knowledge_edges")
    .select("id,from_node_id,to_node_id,edge_type")
    .eq("edge_type", "prerequisite")
    .limit(300000);

  const edgeIdByNodes = new Map();
  for (const row of currentEdges ?? []) {
    edgeIdByNodes.set(`${row.from_node_id}|${row.to_node_id}|prerequisite`, String(row.id));
  }

  const swarmUpserts = [];
  for (const edge of edges) {
    const fromContentId = taskKeyToContentId.get(edge.sourceTask);
    const toContentId = taskKeyToContentId.get(edge.targetTask);
    if (!fromContentId || !toContentId) continue;
    const fromNodeId = freshNodeByRef.get(fromContentId);
    const toNodeId = freshNodeByRef.get(toContentId);
    if (!fromNodeId || !toNodeId) continue;
    const edgeId = edgeIdByNodes.get(`${fromNodeId}|${toNodeId}|prerequisite`);
    if (!edgeId) continue;
    const successRatio = edge.supportCount > 0 ? 1 : 0;
    swarmUpserts.push({
      edge_id: edgeId,
      segment_key: "legacy_seed",
      trials: edge.supportCount,
      successes: edge.supportCount,
      avg_completion: successRatio,
      decay_factor: 1.0,
      exploration_count: 0,
      last_updated: new Date().toISOString()
    });
  }

  for (let i = 0; i < swarmUpserts.length; i += 500) {
    const chunk = swarmUpserts.slice(i, i + 500);
    const { error } = await supabase.from("swarm_edge_stats").upsert(chunk, { onConflict: "edge_id,segment_key" });
    if (error) throw error;
  }

  console.log(
    JSON.stringify(
      {
        inferredTasks: tasks.length,
        inferredEdges: edges.length,
        inserted: {
          contentItems: newContentRows.length,
          knowledgeNodes: missingNodes.length,
          knowledgeEdges: newEdges.length,
          swarmRows: swarmUpserts.length
        }
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error("seed-graph-from-events failed:", err?.message || err);
  process.exit(1);
});
