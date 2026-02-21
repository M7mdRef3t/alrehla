import type { SupabaseClient } from "@supabase/supabase-js";
import type { RoutingContextV2 } from "./context-builder.js";
import type { RoutingCandidateRow } from "./_shared.js";

export interface CandidateV2 {
  id: string;
  title: string;
  message: string;
  cta: string;
  actionType: string;
  actionPayload?: Record<string, unknown>;
  tags: string[];
  contentId?: string;
  edgeId?: string;
  baseScore: number;
  difficulty: number;
  cognitiveLoad: number;
}

export async function loadPrecomputedCandidates(
  supabase: SupabaseClient,
  context: RoutingContextV2,
  limit = 25
): Promise<CandidateV2[]> {
  const nowIso = new Date().toISOString();
  const query = supabase
    .from("routing_candidate_cache")
    .select("id,segment_key,source_node_id,candidate_content_id,edge_id,base_score,reason_codes,expires_at")
    .eq("segment_key", context.segmentKey)
    .gt("expires_at", nowIso)
    .order("base_score", { ascending: false })
    .limit(limit);

  if (context.focusNodeId) {
    query.or(`source_node_id.eq.${context.focusNodeId},source_node_id.is.null`);
  }

  const { data } = await query;
  const rows = (data ?? []) as RoutingCandidateRow[];
  if (rows.length === 0) return [];

  const contentIds = Array.from(new Set(rows.map((r) => r.candidate_content_id)));
  const { data: contentRows } = await supabase
    .from("content_items")
    .select("id,title,difficulty,cognitive_load_required,metadata")
    .in("id", contentIds);

  const byId = new Map<string, any>((contentRows ?? []).map((row: any) => [row.id, row]));
  return rows
    .map((row) => {
      const content = byId.get(row.candidate_content_id);
      if (!content) return null;
      return {
        id: `content_${row.candidate_content_id}`,
        title: String(content.title ?? "خطوة مناسبة الآن"),
        message: String(content?.metadata?.summary ?? "خطوة مناسبة لحالتك الحالية."),
        cta: "ابدأ الآن",
        actionType: "open_mission",
        actionPayload: {
          contentId: row.candidate_content_id,
          edgeId: row.edge_id,
          cacheId: row.id
        },
        tags: Array.isArray(content?.metadata?.tags) ? content.metadata.tags : [],
        contentId: row.candidate_content_id,
        edgeId: row.edge_id ?? undefined,
        baseScore: Number(row.base_score ?? 0),
        difficulty: Number(content.difficulty ?? 3),
        cognitiveLoad: Number(content.cognitive_load_required ?? 3)
      } satisfies CandidateV2;
    })
    .filter((item): item is CandidateV2 => Boolean(item));
}
