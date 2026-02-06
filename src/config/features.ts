export type FeatureFlagMode = "on" | "off" | "beta";

export type FeatureFlagKey =
  | "dawayir_map"
  | "journey_tools"
  | "mirror_tool"
  | "family_tree"
  | "ai_field"
  | "pulse_check";

export interface FeatureFlagDefinition {
  key: FeatureFlagKey;
  label: string;
  description: string;
  group?: string;
  supportsBeta?: boolean;
}

export const FEATURE_FLAGS: FeatureFlagDefinition[] = [
  {
    key: "dawayir_map",
    label: "أداة دواير (الخريطة)",
    description: "تشغيل/إيقاف خريطة العلاقات الأساسية",
    group: "Core"
  },
  {
    key: "journey_tools",
    label: "أدوات الرحلة",
    description: "عرض صفحة الأدوات والمحطات القادمة",
    group: "Core"
  },
  {
    key: "mirror_tool",
    label: "أداة المراية (أنا)",
    description: "بطاقة الذات في مركز الخريطة",
    group: "Core"
  },
  {
    key: "family_tree",
    label: "شجرة العيلة",
    description: "عرض شجرة العائلة في وضع الخريطة العائلية",
    group: "Core"
  },
  {
    key: "ai_field",
    label: "الذكاء الاصطناعي الميداني",
    description: "المساعد الذكي داخل المنصة",
    group: "AI",
    supportsBeta: true
  },
  {
    key: "pulse_check",
    label: "بوابة النبض اللحظي",
    description: "شاشة ضبط البوصلة قبل الدخول",
    group: "AI"
  }
];

export const DEFAULT_FEATURE_FLAGS: Record<FeatureFlagKey, FeatureFlagMode> = {
  dawayir_map: "on",
  journey_tools: "on",
  mirror_tool: "on",
  family_tree: "on",
  ai_field: "beta",
  pulse_check: "on"
};
