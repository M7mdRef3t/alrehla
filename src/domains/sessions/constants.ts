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

export const AGE_RANGES = [
  { value: "18-24", label: "18-24" },
  { value: "25-34", label: "25-34" },
  { value: "35-44", label: "35-44" },
  { value: "45+", label: "45+" },
] as const;

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
  ageRange: "",
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
