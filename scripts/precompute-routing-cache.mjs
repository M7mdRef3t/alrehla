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

const TTL_HOURS = Number(process.env.ROUTING_CACHE_TTL_HOURS || 6);
const DEFAULT_SEGMENTS = [
  "mapping:red",
  "mapping:yellow",
  "mapping:green",
  "awareness:red",
  "awareness:yellow",
  "awareness:green",
  "resistance:red",
  "acceptance:yellow",
  "integration:green"
];

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function scoreEdgeCandidate(edge, content) {
  const baseWeight = Number(edge.base_weight ?? 0);
  const difficulty = Number(content.difficulty ?? 3);
  const cognitiveLoad = Number(content.cognitive_load_required ?? 3);
  const difficultyPenalty = Math.max(0, (difficulty - 3) * 0.08);
  const cognitivePenalty = Math.max(0, (cognitiveLoad - 3) * 0.07);
  return baseWeight - difficultyPenalty - cognitivePenalty;
}

async function main() {
  const now = new Date();
  const expiresAt = addHours(now, TTL_HOURS).toISOString();

  const [{ data: edges }, { data: nodes }, { data: contentItems }] = await Promise.all([
    supabase
      .from("knowledge_edges")
      .select("id,from_node_id,to_node_id,edge_type,base_weight,active")
      .eq("active", true)
      .in("edge_type", ["helps_with", "similar_to", "prerequisite"]),
    supabase.from("knowledge_nodes").select("id,node_type,ref_id").eq("node_type", "content"),
    supabase
      .from("content_items")
      .select("id,title,status,difficulty,cognitive_load_required,metadata")
      .eq("status", "active")
  ]);

  const contentNodeByRef = new Map((nodes ?? []).map((n) => [String(n.ref_id), n]));
  const contentById = new Map((contentItems ?? []).map((c) => [String(c.id), c]));
  const rows = [];

  for (const edge of edges ?? []) {
    const toNodeId = String(edge.to_node_id ?? "");
    const contentNode = (nodes ?? []).find((n) => String(n.id) === toNodeId);
    if (!contentNode) continue;
    const contentId = String(contentNode.ref_id ?? "");
    const content = contentById.get(contentId);
    if (!content) continue;
    const baseScore = scoreEdgeCandidate(edge, content);
    if (baseScore <= 0) continue;
    for (const segment of DEFAULT_SEGMENTS) {
      rows.push({
        segment_key: segment,
        source_node_id: edge.from_node_id ?? null,
        candidate_content_id: contentId,
        edge_id: edge.id ?? null,
        base_score: Number(baseScore.toFixed(6)),
        reason_codes: ["graph_precompute"],
        computed_at: now.toISOString(),
        expires_at: expiresAt
      });
    }
  }

  await supabase.from("routing_candidate_cache").delete().lt("expires_at", now.toISOString());

  if (rows.length === 0) {
    console.log("No rows prepared for routing_candidate_cache.");
    return;
  }

  const batchSize = 500;
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const { error } = await supabase.from("routing_candidate_cache").insert(chunk);
    if (error) {
      console.error("Failed inserting cache chunk:", error.message);
      process.exit(1);
    }
  }

  console.log(`Precompute done. Inserted ${rows.length} cache rows (ttl=${TTL_HOURS}h).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
