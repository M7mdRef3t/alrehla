/**
 * Domain: Dawayir — Complete Types
 *
 * يوحّد types الخريطة العلائقية من مصدر واحد.
 * MapNode الأصلي في @/modules/map/mapTypes — نستورد منه ولا ننسخ.
 */

// Re-exports from map module (source of truth)
export type {
  MapNode,
  Ring,
  PersonNote,
  SituationLog,
  HealthAnswers,
  TreeRelation,
  DailyPathProgress,
  RealityAnswers,
  QuickAnswerValue,
  MissionProgress,
  PersonViewInsights,
  OrbitHistoryEntry,
  MapType,
  FeelingCheckResult,
} from "@/modules/map/mapTypes";

// Re-exports from relationalFieldEngine (analytical types)
export type {
  HiddenPatternKind,
  HiddenPatternSignal,
  RelationshipFlowVector,
  PainFieldMetrics,
  TwinScenarioId,
  TwinScenario,
  DigitalTwinDecision,
  RelationalFieldSnapshot,
  BuildRelationalFieldInput,
} from "@/services/relationalFieldEngine";

// Re-exports from graphProjectionEngine
export type { RelationType } from "@/services/graphProjectionEngine";

// ─── Cloud Map Types ────────────────────────────────

export type NodeData = {
  id: string;
  label: string;
  size: "small" | "medium" | "large";
  color: "core" | "danger" | "ignored" | "neutral";
  mass: number;
};

export type EdgeData = {
  source: string;
  target: string;
  type: "draining" | "stable" | "ignored" | "conflict";
  animated: boolean;
};

export interface DawayirMapState {
  id?: string;
  nodes: NodeData[];
  edges: EdgeData[];
  insight_message: string;
  detected_symptoms?: string[];
  metadata?: Record<string, unknown>;
}

// ─── Sync Types ─────────────────────────────────────

export interface MapSyncPayload {
  sessionId: string;
  nodes: import("@/modules/map/mapTypes").MapNode[];
  updatedAt: string;
  needsSync: boolean;
  lastError?: string | null;
}

export type MapSyncStatus = "idle" | "pending" | "syncing" | "synced" | "error" | "offline";

// ─── Domain Events ──────────────────────────────────

export type DawayirDomainEvent =
  | { type: "node_added"; nodeId: string; ring: string }
  | { type: "node_archived"; nodeId: string }
  | { type: "ring_changed"; nodeId: string; from: string; to: string }
  | { type: "detachment_toggled"; nodeId: string; value: boolean }
  | { type: "map_synced"; timestamp: string }
  | { type: "relational_snapshot_ready"; painIntensity: number };
