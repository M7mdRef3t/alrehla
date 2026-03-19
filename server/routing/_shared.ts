import { getServiceSupabase, parseJsonBody } from "../../api/user/_shared";

export type RoutingCandidateRow = {
  id: number;
  segment_key: string;
  source_node_id: string | null;
  candidate_content_id: string;
  edge_id: string | null;
  base_score: number;
  reason_codes: string[] | null;
  expires_at: string;
};

export type SwarmEdgeStatsRow = {
  edge_id: string;
  segment_key: string;
  trials: number;
  successes: number;
  avg_completion: number;
  decay_factor: number;
  exploration_count: number;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function randomId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export { getServiceSupabase, parseJsonBody };

