import { logger } from "../services/logger";
import { supabase } from "./supabaseClient";

/* ══════════════════════════════════════════
   Partner Compare Service
   ══════════════════════════════════════════ */

/** Generate a random 6-char alphanumeric share code */
export function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I/O/0/1 for readability
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export interface AnalysisResult {
  id: string;
  share_code: string;
  role: "initiator" | "partner";
  scores: Record<string, number>;
  total: number;
  created_at: string;
}

/** Save analysis result to Supabase */
export async function saveAnalysisResult(
  shareCode: string,
  role: "initiator" | "partner",
  scores: Record<string, number>,
  total: number,
): Promise<AnalysisResult | null> {
  if (!supabase) {
    logger.error("[PartnerCompare] Supabase not ready");
    return null;
  }

  const { data, error } = await supabase
    .from("analysis_results")
    .insert({ share_code: shareCode, role, scores, total })
    .select()
    .single();

  if (error) {
    logger.error("[PartnerCompare] Save error:", error);
    return null;
  }
  return data as AnalysisResult;
}

/** Get both initiator and partner results for a share code */
export async function getComparisonResults(
  shareCode: string,
): Promise<{ initiator: AnalysisResult | null; partner: AnalysisResult | null }> {
  if (!supabase) return { initiator: null, partner: null };

  const { data, error } = await supabase
    .from("analysis_results")
    .select("*")
    .eq("share_code", shareCode)
    .order("created_at", { ascending: true });

  if (error || !data) {
    logger.error("[PartnerCompare] Fetch error:", error);
    return { initiator: null, partner: null };
  }

  const initiator = (data as AnalysisResult[]).find((r) => r.role === "initiator") ?? null;
  const partner = (data as AnalysisResult[]).find((r) => r.role === "partner") ?? null;
  return { initiator, partner };
}

/** Check if initiator result exists for a share code */
export async function hasInitiatorResult(shareCode: string): Promise<boolean> {
  if (!supabase) return false;
  const { count } = await supabase
    .from("analysis_results")
    .select("id", { count: "exact", head: true })
    .eq("share_code", shareCode)
    .eq("role", "initiator");
  return (count ?? 0) > 0;
}
