import type { Ring } from "../modules/map/mapTypes";

/** سياق القراءة فقط للـ Agent: عُقد الخريطة، الشاشة الحالية، الهدف. */
export interface AgentContext {
  /** ملخص العُقد: id, label, ring */
  nodesSummary: { id: string; label: string; ring: Ring }[];
  /** الشاشة الحالية */
  screen: "landing" | "goal" | "map";
  /** معرف العقدة المفتوحة (نافذة الشخص) إن وُجدت */
  selectedNodeId: string | null;
  /** هدف الرحلة الحالية */
  goalId: string;
  /** فئة النصيحة */
  category: string;
}

/** مسار للتنقل أو overlay */
export type AgentRoute =
  | "breathing"
  | "gym"
  | "map"
  | "baseline"
  | "emergency"
  | `person:${string}`;

/** واجهة تنفيذ أفعال الـ Agent على التطبيق */
export interface AgentActions {
  /** تسجيل موقف/سجل لشخص (بالاسم أو المعرف) */
  logSituation: (personLabelOrId: string, text: string, emotionalTag?: string) => Promise<{ ok: boolean; error?: string }>;
  /** إضافة أو تحديث عرض لشخص (معرف من القائمة أو وصف قصير) */
  addOrUpdateSymptom: (personLabelOrId: string, symptomIdOrText: string) => Promise<{ ok: boolean; error?: string }>;
  /** نقل شخص لدائرة (أحمر / أصفر / أخضر) */
  updateRelationshipZone: (personLabelOrId: string, zone: Ring) => Promise<{ ok: boolean; error?: string }>;
  /** التنقل: breathing | gym | map | baseline | emergency | person:nodeId */
  navigate: (route: AgentRoute) => void;
  /** فتح overlay (مثل emergency = غرفة الطوارئ) */
  showOverlay?: (overlayId: string) => void;
}
