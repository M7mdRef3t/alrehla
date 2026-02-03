/**
 * Standard لكل التطبيق — صيغة الاختيارات الموحدة:
 * دايماً/جداً (High) | أحياناً (Medium) | نادراً (Low) | أبداً/لأ (Zero)
 */
export const STANDARD_OPTIONS = [
  { value: "high", label: "دايماً / جداً" },
  { value: "medium", label: "أحياناً" },
  { value: "low", label: "نادراً" },
  { value: "zero", label: "أبداً / لأ" }
] as const;

export type StandardOptionValue = (typeof STANDARD_OPTIONS)[number]["value"];

export const STANDARD_OPTIONS_MAP: Record<string, string> = {
  high: "دايماً / جداً",
  medium: "أحياناً",
  low: "نادراً",
  zero: "أبداً / لأ",
  // توافق مع القيم القديمة
  no: "أبداً / لأ",
  yes: "دايماً / جداً",
  sometimes: "أحياناً",
  often: "دايماً / جداً",
  rarely: "نادراً",
  never: "أبداً / لأ"
};
