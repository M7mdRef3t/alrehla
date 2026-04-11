/**
 * Domain: Dawayir — Public API
 *
 * كل ما يحتاجه أي component أو domain آخر
 * يُستورد من هنا فقط.
 */

// ─── Types ────────────────────────────────────────────
export type {
  // Map types (re-exported from modules/map)
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
  // Analytical types (re-exported from services)
  HiddenPatternKind,
  HiddenPatternSignal,
  RelationshipFlowVector,
  PainFieldMetrics,
  TwinScenarioId,
  TwinScenario,
  DigitalTwinDecision,
  RelationalFieldSnapshot,
  BuildRelationalFieldInput,
  RelationType,
  // Cloud types
  NodeData,
  EdgeData,
  DawayirMapState,
  MapSyncPayload,
  MapSyncStatus,
  DawayirDomainEvent,
} from "./types";

// ─── Services ─────────────────────────────────────────
export { nodeService } from "./services/node.service";
export { relationalAnalysisService } from "./services/relational.service";
export { cloudMapService } from "./services/cloudMap.service";

// ─── Hooks ────────────────────────────────────────────
export { useMapNodes } from "./hooks/useMapNodes";
export { useRelationalField } from "./hooks/useRelationalField";
export { useDawayirGraphSync } from "./hooks/useDawayirGraphSync";
export { useCloudMap } from "./hooks/useCloudMap";
