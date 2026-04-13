/**
 * Domain: Dawayir — Public API
 *
 * كل ما يحتاجه أي component أو domain آخر
 * يُستورد من هنا فقط.
 */

// ─── Types ────────────────────────────────────────────
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
} from "./mapTypes";

// Analytical & Cloud Types (re-exported from Dawayir SDK)
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
  NodeData,
  EdgeData,
  DawayirMapState,
  MapSyncPayload,
  MapSyncStatus,
  DawayirDomainEvent,
} from "@alrehla/dawayir";

export {
  interpretPainLevel,
  summarizeTwinRecommendation,
} from "@alrehla/dawayir";

// Other Types natively handled by the platform
export type { RelationType } from "@/services/graphProjectionEngine";

// ─── Services ─────────────────────────────────────────
export { nodeService } from "./services/node.service";
export { relationalAnalysisService } from "./services/relational.service";
export { cloudMapService } from "./services/cloudMap.service";

// ─── Hooks ────────────────────────────────────────────
export { useMapNodes } from "./hooks/useMapNodes";
export { useRelationalField } from "./hooks/useRelationalField";
export { useDawayirGraphSync } from "./hooks/useDawayirGraphSync";
export { useCloudMap } from "./hooks/useCloudMap";

// ─── Stores ───────────────────────────────────────────
export { useMapState } from "./store/map.store";
export type { RecoveryPlanOpenWith } from "./store/map.store";
export { useToastState } from "./store/toast.store";
export { useAppShellNavigationState } from "./store/navigation.store";
export type { AppShellScreen } from "./store/navigation.store";
export { useMeState } from "./store/me.store";
export type { BatteryState } from "./store/me.store";
export { useLifeState } from "./store/life.store";
export { useLayoutState } from "./store/layout.store";
export type { LayoutMode } from "./store/layout.store";
export { useAppContentState, initAppContentRealtime } from "./store/content.store";
