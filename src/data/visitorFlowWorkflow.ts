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

export type PulseAbandonReasonFilter = "all" | "backdrop" | "close_button" | "programmatic";

export const VISITOR_FLOW_STEPS: FlowStepConfig[] = [
  { id: "root", scenarioLabel: "", title: "الصفحة الرئيسية", action: "", variant: "root" },
  { id: "root-action-profile-v2", scenarioLabel: "إجراء ١ (ناجح)", title: "ضغط أيقونة الحساب", action: "فتح شاشة الحساب/الدخول", variant: "sub", accent: "teal", eventKey: "profile_clicked" },
  { id: "root-action-start-v2", scenarioLabel: "إجراء ٢ (ناجح)", title: "الضغط على «يلا نبدأ»", action: "فتح شاشة ضبط البوصلة", variant: "sub", accent: "teal", eventKey: "landing_clicked_start" },
  { id: "root-action-exit-v2", scenarioLabel: "إجراء ٣ (فشل)", title: "زائر يقفل المنصة", action: "الخروج قبل بدء الرحلة", variant: "sub", accent: "rose", eventKey: "landing_closed" },
  { id: "root-action-install-v2", scenarioLabel: "إجراء ٤ (ناجح)", title: "الضغط على تثبيت التطبيق", action: "محاولة تثبيت الـ PWA", variant: "sub", accent: "teal", eventKey: "install_clicked" },

  { id: "profile-success-v2", scenarioLabel: "نتيجة", title: "مستخدم مؤهل للدخول", action: "انتقال لرحلة المستخدم", variant: "sub", accent: "teal" },
  { id: "install-success-v2", scenarioLabel: "نتيجة", title: "جاهزية رجوع أسرع", action: "تثبيت/تلميح التثبيت ظهر", variant: "sub", accent: "teal" },
  { id: "exit-fail-v2", scenarioLabel: "نتيجة", title: "فقدان زائر", action: "انقطاع قبل بدء الرحلة", variant: "sub", accent: "rose" },

  { id: "pulse-fail-close-to-landing-v2", scenarioLabel: "قرار ١ (فشل)", title: "إغلاق البوصلة والرجوع للرئيسية", action: "إغلاق من النافذة أو الخلفية", variant: "sub", accent: "rose", eventKey: "pulse_closed_to_landing" },
  { id: "pulse-fail-browser-close-v2", scenarioLabel: "قرار ٢ (فشل)", title: "إغلاق المتصفح", action: "خروج قبل إكمال ضبط البوصلة", variant: "sub", accent: "rose", eventKey: "pulse_abandoned_browser_close" },
  { id: "s2-3", scenarioLabel: "قرار ٣ (نجاح)", title: "اختيارات ثم «احفظ القراية»", action: "إرسال بوصلة مخصّصة", variant: "sub", accent: "teal", eventKey: "pulse_completed_with_choices" },
  { id: "s2-4", scenarioLabel: "قرار ٤ (نجاح)", title: "«احفظ القراية» بدون اختيار", action: "إرسال بالقيم الافتراضية", variant: "sub", accent: "teal", eventKey: "pulse_completed_without_choices" }
];

/** [childId, parentId][] */
export const VISITOR_FLOW_LINKS: Array<[string, string]> = [
  ["root-action-install-v2", "root"],
  ["root-action-exit-v2", "root"],
  ["root-action-start-v2", "root"],
  ["root-action-profile-v2", "root"],

  ["install-success-v2", "root-action-install-v2"],
  ["exit-fail-v2", "root-action-exit-v2"],
  ["profile-success-v2", "root-action-profile-v2"],

  ["pulse-fail-close-to-landing-v2", "root-action-start-v2"],
  ["pulse-fail-browser-close-v2", "root-action-start-v2"],
  ["s2-3", "root-action-start-v2"],
  ["s2-4", "root-action-start-v2"],
  // Return path: close compass -> back to landing
  ["root", "pulse-fail-close-to-landing-v2"]
];

function getPulseAbandonReasonLabel(reason: PulseAbandonReasonFilter): string {
  if (reason === "backdrop") return "بالضغط خارج النافذة";
  if (reason === "close_button") return "بزر الإغلاق";
  if (reason === "programmatic") return "إغلاق برمجي";
  return "الكل";
}

export function buildFlowNodes(
  byStep: Record<string, number> | undefined,
  options?: {
    selectedPulseAbandonReason?: PulseAbandonReasonFilter;
    pulseAbandonedByReason?: Record<string, number>;
  }
): FlowNode[] {
  const selectedReason = options?.selectedPulseAbandonReason ?? "all";
  const reasonCounts = options?.pulseAbandonedByReason ?? {};
  const successCount =
    (byStep?.profile_clicked ?? 0)
    + (byStep?.landing_clicked_start ?? 0)
    + (byStep?.install_clicked ?? 0);
  const failCount = byStep?.landing_closed ?? 0;
  const totalRootOutcomes = successCount + failCount;
  const successRate = totalRootOutcomes > 0
    ? Math.round((successCount / totalRootOutcomes) * 100)
    : null;

  return VISITOR_FLOW_STEPS.map((s) => {
    const { eventKey, ...rest } = s;
    const isPulseAbandonedNode = s.id === "s2-1";
    const isRootNode = s.id === "root";
    const count = eventKey
      ? isPulseAbandonedNode && selectedReason !== "all"
        ? reasonCounts[selectedReason] ?? 0
        : byStep?.[eventKey]
      : isRootNode
        ? totalRootOutcomes || undefined
        : undefined;

    const action = isRootNode
      ? successRate == null
        ? "بانتظار بيانات كافية لاحتساب النجاح"
        : `نسبة النجاح: ${successRate}% • نجاح ${successCount} / فشل ${failCount}`
      : isPulseAbandonedNode && selectedReason !== "all"
        ? `إغلاق قبل الإكمال • ${getPulseAbandonReasonLabel(selectedReason)}`
        : rest.action;

    return {
      ...rest,
      action,
      count
    };
  });
}
