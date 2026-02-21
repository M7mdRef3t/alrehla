export type FeatureFlagMode = "on" | "off" | "beta";

export type FeatureFlagKey =
  | "dawayir_map"
  | "journey_tools"
  | "basic_diagnosis"
  | "mirror_tool"
  | "family_tree"
  | "internal_boundaries"
  | "generative_ui_mode"
  | "global_atlas"
  | "ai_field"
  | "pulse_check"
  | "pulse_weekly_recommendation"
  | "pulse_immediate_action"
  | "dynamic_routing_v2"
  | "dynamic_routing_owner_observability"
  | "golden_needle_enabled"
  | "language_switcher"
  | "armory_section";

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
    key: "basic_diagnosis",
    label: "التشخيص الأساسي",
    description: "تشغيل التشخيص السريع ونوافذ قراءة الحالة",
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
    key: "internal_boundaries",
    label: "الحدود الداخلية",
    description: "أدوات السيطرة على الضجيج وفك الذنب",
    group: "Core"
  },
  {
    key: "generative_ui_mode",
    label: "GenUI الميداني",
    description: "تغييرات واجهة ذكية حسب السياق اللحظي",
    group: "AI",
    supportsBeta: true
  },
  {
    key: "global_atlas",
    label: "الواجهة الكونية",
    description: "تشغيل/إيقاف العرض الكوني ومحاكي السيناريوهات داخل الصفحة الرئيسية",
    group: "Insights"
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
  },
  {
    key: "pulse_weekly_recommendation",
    label: "اقتراح الطاقة الأسبوعي",
    description: "عرض اقتراح مستوى الطاقة بناءً على متوسط الأسبوع",
    group: "AI"
  },
  {
    key: "pulse_immediate_action",
    label: "الخطوة الفورية للطاقة",
    description: "عرض خطوة عملية فورية بناءً على مستوى الطاقة الحالي",
    group: "AI"
  },
  {
    key: "dynamic_routing_v2",
    label: "Dynamic Routing V2",
    description: "محرك توجيه ديناميكي مع precompute + swarm ranking",
    group: "AI",
    supportsBeta: true
  },
  {
    key: "dynamic_routing_owner_observability",
    label: "Routing Owner Observability",
    description: "إظهار مقاييس الاستكشاف/الاستغلال ومخرجات المحرك للأونر",
    group: "Insights"
  },
  {
    key: "golden_needle_enabled",
    label: "الإبرة الذهبية",
    description: "تفعيل شكل البوصلة الفخرية في شاشة القياس",
    group: "Core"
  },
  {
    key: "language_switcher",
    label: "زر تبديل اللغة",
    description: "إظهار/إخفاء زر تبديل اللغة في الصفحة الرئيسية",
    group: "Core"
  },
  {
    key: "armory_section",
    label: "سيكشن الترسانة",
    description: "إظهار/إخفاء سكشن الترسانة في الصفحة الرئيسية",
    group: "Core"
  }
];

export const DEFAULT_FEATURE_FLAGS: Record<FeatureFlagKey, FeatureFlagMode> = {
  dawayir_map: "on",
  journey_tools: "on",
  basic_diagnosis: "on",
  mirror_tool: "off",
  family_tree: "off",
  internal_boundaries: "off",
  generative_ui_mode: "off",
  global_atlas: "off",
  ai_field: "on",
  pulse_check: "on",
  pulse_weekly_recommendation: "off",
  pulse_immediate_action: "off",
  dynamic_routing_v2: "off",
  dynamic_routing_owner_observability: "off",
  golden_needle_enabled: "off",
  language_switcher: "off",
  armory_section: "off"
};
