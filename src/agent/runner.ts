import { useMapState } from '@/modules/map/dawayirIndex';
import { isKnownSymptomId } from "./tools";
import type { AgentActions } from "./types";
import type { FeatureFlagKey } from "@/config/features";

const LOCKED_REPLY = "الجزء ده لسه بيتبني. نكمل بالدائرة الحالية الأول.";

export interface RunnerDeps {
  /** حل اسم الشخص إلى nodeId. إن لم يُوجد يُرجع null. */
  resolvePerson: (personLabelOrId: string) => string | null;
  /** فتح تمرين التنفس */
  onNavigateBreathing: () => void;
  /** فتح صالة التدريب */
  onNavigateGym: () => void;
  /** الانتقال لشاشة الخريطة */
  onNavigateMap: () => void;
  /** فتح القياس الأولي */
  onNavigateBaseline: () => void;
  /** فتح غرفة الطوارئ (Phase 2) */
  onNavigateEmergency?: () => void;
  /** صلاحيات الميزات المتاحة */
  availableFeatures: Record<FeatureFlagKey, boolean>;
  /** فتح نافذة شخص معين (على الخريطة) */
  onNavigatePerson: (nodeId: string) => void;
}

/** بناء AgentActions من mapState + RunnerDeps */
export function createAgentActions(deps: RunnerDeps): AgentActions {
  const {
    resolvePerson,
    onNavigateBreathing,
    onNavigateGym,
    onNavigateMap,
    onNavigateBaseline,
    onNavigateEmergency,
    availableFeatures,
    onNavigatePerson
  } = deps;

  const getState = useMapState.getState;

  const logSituation: AgentActions["logSituation"] = async (personLabelOrId, text, emotionalTag) => {
    if (!availableFeatures.dawayir_map || !availableFeatures.basic_diagnosis) {
      return { ok: false, error: LOCKED_REPLY };
    }
    const nodeId = resolvePerson(personLabelOrId);
    if (!nodeId) return { ok: false, error: `لم أجد شخصاً بهذا الاسم أو المعرف: ${personLabelOrId}` };
    try {
      getState().addSituationLog(nodeId, {
        situation: text,
        feeling: emotionalTag ?? "عام",
        response: "-",
        outcome: "-",
        lesson: "-"
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  };

  const addOrUpdateSymptom: AgentActions["addOrUpdateSymptom"] = async (personLabelOrId, symptomIdOrText) => {
    if (!availableFeatures.dawayir_map || !availableFeatures.basic_diagnosis) {
      return { ok: false, error: LOCKED_REPLY };
    }
    const nodeId = resolvePerson(personLabelOrId);
    if (!nodeId) return { ok: false, error: `لم أجد شخصاً بهذا الاسم أو المعرف: ${personLabelOrId}` };
    const node = getState().nodes.find((n) => n.id === nodeId);
    if (!node?.analysis) return { ok: false, error: "هذه العقدة لا تحتوي تحليلاً؛ لا يمكن إضافة أعراض." };
    try {
      const current = node.analysis.selectedSymptoms ?? [];
      const value = symptomIdOrText.trim();
      if (isKnownSymptomId(value)) {
        const id = value.toLowerCase();
        const next = current.includes(id) ? current : [...current, id];
        getState().updateNodeSymptoms(nodeId, next);
        return { ok: true };
      }
      getState().addNoteToNode(nodeId, `عرض: ${value}`);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  };

  const updateRelationshipZone: AgentActions["updateRelationshipZone"] = async (personLabelOrId, zone) => {
    if (!availableFeatures.dawayir_map || !availableFeatures.basic_diagnosis) {
      return { ok: false, error: LOCKED_REPLY };
    }
    const nodeId = resolvePerson(personLabelOrId);
    if (!nodeId) return { ok: false, error: `لم أجد شخصاً بهذا الاسم أو المعرف: ${personLabelOrId}` };
    try {
      getState().moveNodeToRing(nodeId, zone);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  };

  const navigate: AgentActions["navigate"] = (route) => {
    if (route === "map" && !availableFeatures.dawayir_map) {
      return { ok: false, error: LOCKED_REPLY };
    }
    if (route.startsWith("person:") && (!availableFeatures.dawayir_map || !availableFeatures.basic_diagnosis)) {
      return { ok: false, error: LOCKED_REPLY };
    }
    if (route === "breathing") onNavigateBreathing();
    else if (route === "gym") onNavigateGym();
    else if (route === "map") onNavigateMap();
    else if (route === "baseline") onNavigateBaseline();
    else if (route === "emergency") onNavigateEmergency?.();
    else if (route.startsWith("person:")) onNavigatePerson(route.slice(7).trim());
    return { ok: true };
  };

  const showOverlay: AgentActions["showOverlay"] = (overlayId) => {
    if (overlayId === "emergency") {
      onNavigateEmergency?.();
      return { ok: true };
    }
    return { ok: false, error: "overlayId غير صالح" };
  };

  return {
    logSituation,
    addOrUpdateSymptom,
    updateRelationshipZone,
    navigate,
    showOverlay
  };
}

/** حل personLabelOrId إلى nodeId من قائمة العُقد (أول تطابق بالاسم أو المعرف) */
export function resolvePersonFromNodes(
  personLabelOrId: string,
  nodes: { id: string; label: string }[]
): string | null {
  const trimmed = personLabelOrId.trim();
  const byId = nodes.find((n) => n.id === trimmed);
  if (byId) return byId.id;
  const byLabel = nodes.find((n) => n.label.trim() === trimmed || n.label.includes(trimmed));
  return byLabel?.id ?? null;
}
