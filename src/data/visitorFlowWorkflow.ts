/**
 * Automated Visitor Flow Workflow
 * بيانات التدفق — تعديل هنا يحدّث الخريطة تلقائياً
 */

import type { FlowNode } from "../components/admin/FlowMindMap";

export interface FlowStepConfig {
  id: string;
  scenarioLabel: string;
  title: string;
  action: string;
  variant: "root" | "branch" | "sub";
  accent?: "teal" | "amber" | "rose" | "slate";
  /** مفتاح الحدث في flowStats.byStep */
  eventKey?: string;
}

export const VISITOR_FLOW_STEPS: FlowStepConfig[] = [
  { id: "root", scenarioLabel: "", title: "الصفحة الرئيسية", action: "", variant: "root" },
  { id: "s1", scenarioLabel: "سيناريو ١", title: "الباحث عن الهوية", action: "ضغط أيقونة الحساب", variant: "branch", eventKey: "profile_clicked" },
  { id: "s2", scenarioLabel: "سيناريو ٢", title: "المستعد للتغيير", action: "ضغط «يلا نبدأ»", variant: "branch", accent: "amber", eventKey: "landing_clicked_start" },
  { id: "s2-1", scenarioLabel: "سيناريو ٢-١", title: "المتردد", action: "إغلاق قبل الإكمال", variant: "sub", accent: "rose", eventKey: "pulse_abandoned" },
  { id: "s2-2", scenarioLabel: "سيناريو ٢-٢", title: "المثابر", action: "احفظ القراية وادخل", variant: "sub", accent: "teal", eventKey: "pulse_completed" }
];

/** [childId, parentId][] */
export const VISITOR_FLOW_LINKS: Array<[string, string]> = [
  ["s1", "root"],
  ["s2", "root"],
  ["s2-1", "s2"],
  ["s2-2", "s2"]
];

export function buildFlowNodes(byStep: Record<string, number> | undefined): FlowNode[] {
  return VISITOR_FLOW_STEPS.map((s) => {
    const { eventKey, ...rest } = s;
    return {
      ...rest,
      count: eventKey ? byStep?.[eventKey] : undefined
    };
  });
}
