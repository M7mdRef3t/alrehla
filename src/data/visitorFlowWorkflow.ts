/**
 * Automated Visitor Flow Workflow
 * بيانات التدفق — تعديل هنا يحدّث الخريطة تلقائياً
 */

import type { FlowNode } from "../components/admin/flow-mind-map/types";

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
  { id: "phase-pre-auth-v2", scenarioLabel: "Phase", title: "Pre-Auth Onboarding", action: "التهيئة قبل التسجيل", variant: "branch", accent: "amber" },
  { id: "phase-auth-v2", scenarioLabel: "Phase", title: "Auth Gate", action: "بوابة التسجيل والنية", variant: "branch", accent: "amber" },
  { id: "phase-core-v2", scenarioLabel: "Phase", title: "Core App", action: "التجربة الأساسية داخل التطبيق", variant: "branch", accent: "slate" },
  { id: "root-action-profile-v2", scenarioLabel: "إجراء ١ (ناجح)", title: "ضغط أيقونة الحساب", action: "فتح شاشة الحساب/الدخول", variant: "sub", accent: "teal", eventKey: "profile_clicked" },
  { id: "root-action-start-v2", scenarioLabel: "إجراء ٢ (ناجح)", title: "الضغط على «تفعيل الرادار والانطلاق»", action: "فتح شاشة ضبط البوصلة", variant: "sub", accent: "teal", eventKey: "landing_clicked_start" },
  { id: "root-action-exit-v2", scenarioLabel: "إجراء ٣ (فشل)", title: "زائر يقفل المنصة", action: "الخروج قبل بدء الرحلة", variant: "sub", accent: "rose", eventKey: "landing_closed" },
  { id: "root-action-install-v2", scenarioLabel: "إجراء ٤ (ناجح)", title: "الضغط على تثبيت التطبيق", action: "محاولة تثبيت الـ PWA", variant: "sub", accent: "teal", eventKey: "install_clicked" },

  { id: "profile-success-v2", scenarioLabel: "نتيجة", title: "مستخدم مؤهل للدخول", action: "انتقال لرحلة المستخدم", variant: "sub", accent: "teal" },
  { id: "install-success-v2", scenarioLabel: "نتيجة", title: "جاهزية رجوع أسرع", action: "تثبيت/تلميح التثبيت ظهر", variant: "sub", accent: "teal" },
  { id: "exit-fail-v2", scenarioLabel: "نتيجة", title: "فقدان زائر", action: "انقطاع قبل بدء الرحلة", variant: "sub", accent: "rose" },

  { id: "pulse-fail-close-to-landing-v2", scenarioLabel: "قرار ١ (فشل)", title: "إغلاق البوصلة والرجوع للرئيسية", action: "إغلاق من النافذة أو الخلفية", variant: "sub", accent: "rose", eventKey: "pulse_closed_to_landing" },
  { id: "pulse-fail-browser-close-v2", scenarioLabel: "قرار ٢ (فشل)", title: "إغلاق المتصفح", action: "خروج قبل إكمال ضبط البوصلة", variant: "sub", accent: "rose", eventKey: "pulse_abandoned_browser_close" },
  { id: "s2-3", scenarioLabel: "قرار ٣ (نجاح)", title: "اختيارات ثم «احفظ القراية»", action: "إرسال بوصلة مخصّصة", variant: "sub", accent: "teal", eventKey: "pulse_completed_with_choices" },
  { id: "s2-4", scenarioLabel: "قرار ٤ (نجاح)", title: "«احفظ القراية» بدون اختيار", action: "إرسال بالقيم الافتراضية", variant: "sub", accent: "teal", eventKey: "pulse_completed_without_choices" },
  { id: "onboarding-opened-v2", scenarioLabel: "تمهيد", title: "فتح الأونبوردنج", action: "بدء رحلة ما قبل الدخول", variant: "sub", accent: "amber", eventKey: "onboarding_opened" },
  { id: "onboarding-phase-noise-v2", scenarioLabel: "تمهيد", title: "إنهاء المرحلة ١", action: "تجاوز الشرارة الأولى", variant: "sub", accent: "amber", eventKey: "onboarding_phase_noise_completed" },
  { id: "onboarding-phase-inventory-v2", scenarioLabel: "تمهيد", title: "إنهاء المرحلة ٢", action: "تجميع الأشخاص المؤثرين", variant: "sub", accent: "amber", eventKey: "onboarding_phase_inventory_completed" },
  { id: "onboarding-phase-mapping-v2", scenarioLabel: "تمهيد", title: "إنهاء المرحلة ٣", action: "توزيع الأشخاص على المدارات", variant: "sub", accent: "amber", eventKey: "onboarding_phase_mapping_completed" },
  { id: "onboarding-completed-v2", scenarioLabel: "تمهيد (نجاح)", title: "إكمال الأونبوردنج", action: "جاهز لبوابة الدخول", variant: "sub", accent: "teal", eventKey: "onboarding_completed" },
  { id: "onboarding-skipped-v2", scenarioLabel: "تمهيد (تخطي)", title: "تخطي الأونبوردنج", action: "الانتقال مباشرة للخريطة", variant: "sub", accent: "amber", eventKey: "onboarding_skipped" },
  { id: "auth-gate-opened-v2", scenarioLabel: "بوابة", title: "فتح بوابة التسجيل", action: "طلب Google/Magic Link", variant: "sub", accent: "amber", eventKey: "auth_gate_opened" },
  { id: "auth-success-v2", scenarioLabel: "بوابة (نجاح)", title: "تسجيل دخول ناجح", action: "استرجاع نية ما بعد الدخول", variant: "sub", accent: "teal", eventKey: "auth_login_success" },
  { id: "post-auth-phase-one-map-v2", scenarioLabel: "ما بعد الدخول", title: "الانتقال للخريطة مباشرة", action: "Phase-1: map + family", variant: "sub", accent: "teal", eventKey: "post_auth_intent_phase_one_map" },
  { id: "post-auth-goal-picker-v2", scenarioLabel: "ما بعد الدخول", title: "الانتقال لاختيار الهدف", action: "البدء من شاشة goal", variant: "sub", accent: "teal", eventKey: "post_auth_intent_goal_picker" },
  { id: "goal-selected-v2", scenarioLabel: "التجربة الأساسية", title: "اختيار الهدف", action: "تحديد goal/category", variant: "sub", accent: "teal", eventKey: "goal_selected" },
  { id: "screen-map-viewed-v2", scenarioLabel: "التجربة الأساسية", title: "دخول شاشة الخريطة", action: "فتح الرادار الأساسي", variant: "sub", accent: "teal", eventKey: "screen_map_viewed" },
  { id: "screen-guided-viewed-v2", scenarioLabel: "التجربة الأساسية", title: "دخول المسار الموجّه", action: "بدء Guided Journey", variant: "sub", accent: "slate", eventKey: "screen_guided_viewed" },
  { id: "screen-mission-viewed-v2", scenarioLabel: "التجربة الأساسية", title: "دخول شاشة المهمة", action: "متابعة المهام اليومية", variant: "sub", accent: "teal", eventKey: "screen_mission_viewed" },
  { id: "screen-tools-viewed-v2", scenarioLabel: "التجربة الأساسية", title: "دخول شاشة الأدوات", action: "فتح الأدوات التكتيكية", variant: "sub", accent: "teal", eventKey: "screen_tools_viewed" },
  { id: "screen-diplomacy-viewed-v2", scenarioLabel: "التجربة الأساسية", title: "دخول الدبلوماسية", action: "فتح البرقيات الدبلوماسية", variant: "sub", accent: "slate", eventKey: "screen_diplomacy_viewed" },
  { id: "screen-guilt-court-viewed-v2", scenarioLabel: "التجربة الأساسية", title: "دخول محكمة الذنب", action: "فتح مسار التفكيك المعرفي", variant: "sub", accent: "slate", eventKey: "screen_guilt_court_viewed" },
  { id: "screen-enterprise-viewed-v2", scenarioLabel: "التجربة الأساسية", title: "دخول Enterprise", action: "فتح بوابة المؤسسة", variant: "sub", accent: "slate", eventKey: "screen_enterprise_viewed" },
  { id: "screen-settings-viewed-v2", scenarioLabel: "التجربة الأساسية", title: "دخول الإعدادات", action: "فتح شاشة إعدادات التطبيق", variant: "sub", accent: "slate", eventKey: "screen_settings_viewed" },
  { id: "screen-oracle-viewed-v2", scenarioLabel: "التجربة الأساسية", title: "دخول لوحة Oracle", action: "عرض لوحة مجلس الحكماء", variant: "sub", accent: "teal", eventKey: "screen_oracle_dashboard_viewed" }
];

/** [childId, parentId][] */
export const VISITOR_FLOW_LINKS: Array<[string, string]> = [
  ["root-action-install-v2", "root"],
  ["root-action-exit-v2", "root"],
  ["root-action-start-v2", "root"],
  ["root-action-profile-v2", "root"],
  ["phase-pre-auth-v2", "root"],
  ["phase-auth-v2", "root"],
  ["phase-core-v2", "root"],

  ["install-success-v2", "root-action-install-v2"],
  ["exit-fail-v2", "root-action-exit-v2"],
  ["profile-success-v2", "root-action-profile-v2"],

  ["pulse-fail-close-to-landing-v2", "root-action-start-v2"],
  ["pulse-fail-browser-close-v2", "root-action-start-v2"],
  ["s2-3", "root-action-start-v2"],
  ["s2-4", "root-action-start-v2"],
  ["onboarding-opened-v2", "root-action-start-v2"],
  ["onboarding-opened-v2", "phase-pre-auth-v2"],
  ["onboarding-phase-noise-v2", "onboarding-opened-v2"],
  ["onboarding-phase-inventory-v2", "onboarding-phase-noise-v2"],
  ["onboarding-phase-mapping-v2", "onboarding-phase-inventory-v2"],
  ["onboarding-completed-v2", "onboarding-phase-mapping-v2"],
  ["onboarding-skipped-v2", "onboarding-opened-v2"],
  ["auth-gate-opened-v2", "s2-3"],
  ["auth-gate-opened-v2", "s2-4"],
  ["auth-gate-opened-v2", "root-action-profile-v2"],
  ["auth-gate-opened-v2", "phase-auth-v2"],
  ["auth-success-v2", "auth-gate-opened-v2"],
  ["post-auth-phase-one-map-v2", "auth-success-v2"],
  ["post-auth-goal-picker-v2", "auth-success-v2"],
  ["goal-selected-v2", "post-auth-goal-picker-v2"],
  ["screen-map-viewed-v2", "s2-3"],
  ["screen-map-viewed-v2", "s2-4"],
  ["screen-map-viewed-v2", "phase-core-v2"],
  ["screen-map-viewed-v2", "post-auth-phase-one-map-v2"],
  ["screen-map-viewed-v2", "goal-selected-v2"],
  ["screen-guided-viewed-v2", "screen-map-viewed-v2"],
  ["screen-mission-viewed-v2", "screen-map-viewed-v2"],
  ["screen-tools-viewed-v2", "screen-map-viewed-v2"],
  ["screen-diplomacy-viewed-v2", "screen-map-viewed-v2"],
  ["screen-guilt-court-viewed-v2", "screen-map-viewed-v2"],
  ["screen-enterprise-viewed-v2", "screen-map-viewed-v2"],
  ["screen-settings-viewed-v2", "screen-map-viewed-v2"],
  ["screen-oracle-viewed-v2", "screen-map-viewed-v2"],
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
    const isPulseAbandonedNode = s.eventKey === "pulse_closed_to_landing";
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
