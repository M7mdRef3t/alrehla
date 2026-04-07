import type { MapNode } from "@/modules/map/mapTypes";
import { deriveBoundaryEvidence } from "./boundaryEvidence";

export interface EmergencyContext {
  personId?: string;
  personLabel?: string;
  goalId?: string;
  title?: string;
  body?: string;
  reasons?: string[];
  source?: "generic" | "person" | "ai";
}

export function buildEmergencyContextFromNode(node: MapNode): EmergencyContext {
  const evidence = deriveBoundaryEvidence(node, node.label);
  const reasons = evidence?.items.slice(0, 3) ?? [];

  return {
    personId: node.id,
    personLabel: node.label,
    goalId: node.goalId ?? (node.treeRelation?.type === "family" ? "family" : "general"),
    title: `لو ${node.label} فتحك دلوقتي... وقف قبل ما ترد`,
    body:
      node.ring === "red" || node.isEmergency
        ? "الأولوية الآن ليست الشرح ولا الرد السريع. الأهم أن تمنع الجولة القادمة من الاستنزاف."
        : "خذ خطوة تهدئة قصيرة ثم ارجع لقرارك من مكان أهدأ.",
    reasons,
    source: "person"
  };
}
