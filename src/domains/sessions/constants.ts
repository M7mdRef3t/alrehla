/**
 * Domain: Sessions — Constants
 */

export const SESSION_GOAL_OPTIONS = [
  "وضوح الرؤية",
  "قرار محدد",
  "فهم نمط متكرر",
  "مشكلة علاقة",
  "تخفيف ضغط نفسي",
  "شيء آخر",
] as const;

export const COUNTRIES = [
  // عربية
  { value: "EG", label: "🇪🇬 مصر" },
  { value: "SA", label: "🇸🇦 السعودية" },
  { value: "AE", label: "🇦🇪 الإمارات" },
  { value: "KW", label: "🇰🇼 الكويت" },
  { value: "QA", label: "🇶🇦 قطر" },
  { value: "BH", label: "🇧🇭 البحرين" },
  { value: "OM", label: "🇴🇲 عُمان" },
  { value: "JO", label: "🇯🇴 الأردن" },
  { value: "LB", label: "🇱🇧 لبنان" },
  { value: "IQ", label: "🇮🇶 العراق" },
  { value: "SY", label: "🇸🇾 سوريا" },
  { value: "YE", label: "🇾🇪 اليمن" },
  { value: "LY", label: "🇱🇾 ليبيا" },
  { value: "TN", label: "🇹🇳 تونس" },
  { value: "DZ", label: "🇩🇿 الجزائر" },
  { value: "MA", label: "🇲🇦 المغرب" },
  { value: "SD", label: "🇸🇩 السودان" },
  { value: "PS", label: "🇵🇸 فلسطين" },
  // أخرى شائعة
  { value: "US", label: "🇺🇸 الولايات المتحدة" },
  { value: "GB", label: "🇬🇧 المملكة المتحدة" },
  { value: "DE", label: "🇩🇪 ألمانيا" },
  { value: "CA", label: "🇨🇦 كندا" },
  { value: "AU", label: "🇦🇺 أستراليا" },
  { value: "FR", label: "🇫🇷 فرنسا" },
  { value: "OTHER", label: "🌍 دولة أخرى" },
] as const;

export const COUNTRY_DIAL_CODES: Record<string, string> = {
  EG: "+20",
  SA: "+966",
  AE: "+971",
  KW: "+965",
  QA: "+974",
  BH: "+973",
  OM: "+968",
  JO: "+962",
  LB: "+961",
  IQ: "+964",
  SY: "+963",
  YE: "+967",
  LY: "+218",
  TN: "+216",
  DZ: "+213",
  MA: "+212",
  SD: "+249",
  PS: "+970",
  US: "+1",
  GB: "+44",
  DE: "+49",
  CA: "+1",
  AU: "+61",
  FR: "+33",
};

export const PREVIOUS_SESSION_OPTIONS = [
  { value: "none", label: "أول مرة" },
  { value: "coaching", label: "أخدت جلسات كوتشينج قبل كده" },
  { value: "therapy", label: "أخدت علاج/دعم نفسي" },
] as const;

export const INTAKE_STEP_ORDER = [
  "welcome",
  "basic",
  "reason",
  "context",
  "safety",
] as const;

/** Default form state */
export const INITIAL_INTAKE_FORM = {
  name: "",
  phone: "",
  email: "",
  country: "",
  birthDate: "",
  preferredContact: "whatsapp",
  requestReason: "",
  urgencyReason: "",
  biggestChallenge: "",
  previousSessions: "",
  specificPersonOrSituation: "",
  impactScore: 5,
  durationOfProblem: "",
  crisisFlag: false,
  medicalFlag: "",
  sessionGoalType: "",
} as const;
