/**
 * Shared — Feature Flags
 * 
 * مصدر واحد لكل Feature Flags في المشروع.
 * يسهل تفعيل/تعطيل ميزات بدون كود ميت.
 */

export interface FeatureFlag {
  /** هل الميزة مفعلة؟ */
  enabled: boolean;
  /** نسبة الـ rollout (0-100) */
  rollout: number;
  /** وصف قصير */
  description: string;
}

export const FEATURES = {
  // ─── Core Features ───────────────────────────

  SESSION_OS: {
    enabled: true,
    rollout: 100,
    description: "نظام إدارة الجلسات الذكي",
  },

  CONSCIOUSNESS_THEME: {
    enabled: true,
    rollout: 100,
    description: "المحرك الواعي للثيمات والأجواء",
  },

  DAWAYIR_LIVE: {
    enabled: true,
    rollout: 100,
    description: "خرائط العلاقات المباشرة",
  },

  MARAYA_MIRROR: {
    enabled: true,
    rollout: 100,
    description: "مرآة التأمل والوعي الذاتي",
  },

  // ─── Experimental Features ───────────────────

  COMMAND_HUD: {
    enabled: false,
    rollout: 0,
    description: "لوحة القيادة — قيد التطوير",
  },

  B2B_EXPANSION: {
    enabled: false,
    rollout: 0,
    description: "التوسع المؤسسي — قيد التخطيط",
  },

  COGNITIVE_SANDBOX: {
    enabled: false,
    rollout: 0,
    description: "محاكاة الشخصيات الاصطناعية — قيد التطوير",
  },

  VOICE_ENGINE: {
    enabled: false,
    rollout: 0,
    description: "محرك الصوت والمحادثة — قيد التطوير",
  },

} as const satisfies Record<string, FeatureFlag>;

export type FeatureName = keyof typeof FEATURES;

/**
 * هل الميزة مفعلة؟
 */
export function isFeatureEnabled(name: FeatureName): boolean {
  const flag = FEATURES[name];
  if (!flag.enabled) return false;
  if (flag.rollout >= 100) return true;

  // Simple deterministic rollout based on feature name hash
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (hash % 100) < flag.rollout;
}
