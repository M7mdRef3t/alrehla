import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

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

function hashKey(input) {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 32);
}

function normalizeStr(value) {
  return String(value ?? "").trim();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function extractTasksFromSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return [];
  const phases = snapshot.phases ?? {};
  const weeks = ["week1", "week2", "week3"];
  const out = [];
  for (const week of weeks) {
    const tasks = asArray(phases?.[week]?.tasks);
    for (let i = 0; i < tasks.length; i += 1) {
      const task = tasks[i] ?? {};
      const title = normalizeStr(task.title);
      const text = normalizeStr(task.text);
      if (!title && !text) continue;
      out.push({
        week,
        order: i,
        taskId: normalizeStr(task.id) || `${week}-${i + 1}`,
        type: normalizeStr(task.type) || "practice",
        title: title || `Task ${i + 1}`,
        text: text || title || "Legacy task",
        difficultyHint: Number(task.difficultyHint ?? 3),
        requiresInput: Boolean(task.requiresInput)
      });
    }
  }
  return out;
}

function extractTasksFromNode(node, mapContext) {
  const progress = node?.recoveryProgress ?? {};
  const snapshot = progress?.recoveryPathSnapshot;
  const pathId = normalizeStr(progress?.pathId || mapContext.pathId || "legacy_path");
  const nodeLabel = normalizeStr(node?.label || "legacy_node");
  const tasks = extractTasksFromSnapshot(snapshot);

  return tasks.map((task) => {
    const rawKey = [
      mapContext.source,
      pathId,
      task.week,
      task.order,
      task.taskId,
      task.title,
      task.text
    ].join("|");
    const legacyKey = hashKey(rawKey);
    return {
      legacyKey,
      pathId,
      nodeLabel,
      ...task
    };
  });
}

async function loadLegacyMaps() {
  const [{ data: journeyMaps }, { data: dawayirMaps }] = await Promise.all([
    supabase.from("journey_maps").select("session_id,nodes").limit(10000),
    supabase.from("dawayir_maps").select("id,title,nodes").limit(10000)
  ]);
  return { journeyMaps: journeyMaps ?? [], dawayirMaps: dawayirMaps ?? [] };
}

async function loadExistingContentLookup() {
  const { data } = await supabase
    .from("content_items")
    .select("id,title,metadata")
    .limit(20000);
  const map = new Map();
  for (const row of data ?? []) {
    const key = normalizeStr(row?.metadata?.legacy_key);
    if (key) map.set(key, String(row.id));
  }
  return map;
}

async function loadExistingContentKnowledgeNodes() {
  const { data } = await supabase
    .from("knowledge_nodes")
    .select("id,node_type,ref_id")
    .eq("node_type", "content")
    .limit(50000);
  const refSet = new Set();
  for (const row of data ?? []) {
    const ref = normalizeStr(row.ref_id);
    if (ref) refSet.add(ref);
  }
  return refSet;
}

async function loadExistingEdgeKeys() {
  const { data } = await supabase
    .from("knowledge_edges")
    .select("from_node_id,to_node_id,edge_type")
    .in("edge_type", ["prerequisite", "helps_with"])
    .limit(200000);
  const keys = new Set();
  for (const row of data ?? []) {
    const key = `${row.from_node_id}|${row.to_node_id}|${row.edge_type}`;
    keys.add(key);
  }
  return keys;
}

async function insertInChunks(table, rows, chunkSize = 500) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) throw error;
  }
}

async function main() {
  console.log(`seed-graph-from-legacy start (dryRun=${DRY_RUN})`);

  const { journeyMaps, dawayirMaps } = await loadLegacyMaps();
  const allTaskRows = [];

  for (const map of journeyMaps) {
    const nodes = asArray(map.nodes);
    for (const node of nodes) {
      const tasks = extractTasksFromNode(node, {
        source: "journey_maps",
        pathId: node?.recoveryProgress?.pathId ?? null
      });
      allTaskRows.push(...tasks);
    }
  }

  for (const map of dawayirMaps) {
    const nodes = asArray(map.nodes);
    for (const node of nodes) {
      const tasks = extractTasksFromNode(node, {
        source: "dawayir_maps",
        pathId: node?.recoveryProgress?.pathId ?? null
      });
      allTaskRows.push(...tasks);
    }
  }

  if (allTaskRows.length === 0) {
    console.log("No legacy tasks found in recoveryPathSnapshot. Nothing to seed.");
    return;
  }

  // Deduplicate extracted tasks by legacy key.
  const byLegacyKey = new Map();
  for (const row of allTaskRows) {
    if (!byLegacyKey.has(row.legacyKey)) byLegacyKey.set(row.legacyKey, row);
  }
  const uniqueTasks = [...byLegacyKey.values()];

  const existingContentByLegacyKey = await loadExistingContentLookup();
  const toInsertContent = [];
  for (const task of uniqueTasks) {
    if (existingContentByLegacyKey.has(task.legacyKey)) continue;
    toInsertContent.push({
      status: "active",
      title: task.title,
      content_type: task.type,
      lang: "ar",
      estimated_minutes: 5,
      difficulty: Math.max(1, Math.min(5, Number(task.difficultyHint || 3))),
      cognitive_load_required: 3,
      metadata: {
        legacy_key: task.legacyKey,
        legacy_source: "seed_graph_from_legacy",
        path_id: task.pathId,
        week: task.week,
        order: task.order,
        node_label: task.nodeLabel,
        summary: task.text,
        tags: [task.pathId, task.week]
      }
    });
  }

  if (DRY_RUN) {
    console.log(
      JSON.stringify(
        {
          maps: {
            journeyMaps: journeyMaps.length,
            dawayirMaps: dawayirMaps.length
          },
          tasksExtracted: allTaskRows.length,
          uniqueTasks: uniqueTasks.length,
          newContentItems: toInsertContent.length
        },
        null,
        2
      )
    );
    return;
  }

  if (toInsertContent.length > 0) {
    await insertInChunks("content_items", toInsertContent, 300);
  }

  // Refresh lookup after insert.
  const contentLookup = await loadExistingContentLookup();
  const contentKnowledgeRefs = await loadExistingContentKnowledgeNodes();

  const toInsertKnowledgeNodes = [];
  for (const task of uniqueTasks) {
    const contentId = contentLookup.get(task.legacyKey);
    if (!contentId) continue;
    if (contentKnowledgeRefs.has(contentId)) continue;
    toInsertKnowledgeNodes.push({
      node_type: "content",
      ref_id: contentId,
      attributes: {
        seeded_from: "legacy",
        path_id: task.pathId,
        week: task.week
      }
    });
    contentKnowledgeRefs.add(contentId);
  }

  if (toInsertKnowledgeNodes.length > 0) {
    await insertInChunks("knowledge_nodes", toInsertKnowledgeNodes, 500);
  }

  // Build path edges from sequential order inside each (pathId, week) bucket.
  const { data: contentNodes } = await supabase
    .from("knowledge_nodes")
    .select("id,ref_id,node_type")
    .eq("node_type", "content")
    .limit(100000);
  const knowledgeNodeByContentId = new Map();
  for (const row of contentNodes ?? []) {
    knowledgeNodeByContentId.set(String(row.ref_id), String(row.id));
  }

  const grouped = new Map();
  for (const task of uniqueTasks) {
    const key = `${task.pathId}|${task.week}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(task);
  }
  for (const [, list] of grouped) {
    list.sort((a, b) => a.order - b.order);
  }

  const existingEdgeKeys = await loadExistingEdgeKeys();
  const toInsertEdges = [];
  for (const [, list] of grouped) {
    for (let i = 0; i < list.length - 1; i += 1) {
      const a = list[i];
      const b = list[i + 1];
      const contentA = contentLookup.get(a.legacyKey);
      const contentB = contentLookup.get(b.legacyKey);
      if (!contentA || !contentB) continue;
      const fromNodeId = knowledgeNodeByContentId.get(contentA);
      const toNodeId = knowledgeNodeByContentId.get(contentB);
      if (!fromNodeId || !toNodeId || fromNodeId === toNodeId) continue;
      const edgeKey = `${fromNodeId}|${toNodeId}|prerequisite`;
      if (existingEdgeKeys.has(edgeKey)) continue;
      toInsertEdges.push({
        from_node_id: fromNodeId,
        to_node_id: toNodeId,
        edge_type: "prerequisite",
        base_weight: 1.0,
        active: true
      });
      existingEdgeKeys.add(edgeKey);
    }
  }

  if (toInsertEdges.length > 0) {
    await insertInChunks("knowledge_edges", toInsertEdges, 500);
  }

  console.log(
    JSON.stringify(
      {
        maps: {
          journeyMaps: journeyMaps.length,
          dawayirMaps: dawayirMaps.length
        },
        tasksExtracted: allTaskRows.length,
        uniqueTasks: uniqueTasks.length,
        inserted: {
          contentItems: toInsertContent.length,
          knowledgeNodes: toInsertKnowledgeNodes.length,
          knowledgeEdges: toInsertEdges.length
        }
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error("seed-graph-from-legacy failed:", err?.message || err);
  process.exit(1);
});
