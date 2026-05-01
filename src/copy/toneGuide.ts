import type { PulseEntry } from "@/domains/consciousness/store/pulse.store";

export type VoiceMode = "gentle_companion" | "warm_healer" | "wise_observer";

export interface OrbitalTerm {
  classic: string;
  orbital: string;
  meaning: string;
}

export const ORBITAL_DICTIONARY: OrbitalTerm[] = [
  { classic: "علاقة / شخص", orbital: "شخص في رحلتي", meaning: "كل شخص ومكانه في رحلتك حسب تأثيره عليك." },
  { classic: "وضع حدود", orbital: "وضوح المسافة", meaning: "بترسم حدودك عشان تحمي سلامك النفسي." },
  { classic: "تجاهل", orbital: "سكينة مؤقتة", meaning: "فصل مؤقت للهدوء." },
  { classic: "تفكير مفرط", orbital: "دوشة في الدماغ", meaning: "أفكار عابرة مش حقيقية." },
  { classic: "شعور بالذنب", orbital: "تقل داخلي", meaning: "إحساس بيسحب طاقتك لورا." },
  { classic: "راحة نفسية", orbital: "شحن طاقة", meaning: "استرجاع مساحتك ونفسك." },
  { classic: "إنهاء العلاقة", orbital: "تحرر", meaning: "اختيار إن الخطوة دي تنتهي هنا." },
  // ── بدائل العقيدة المعرفية (Cognitive Doctrine) ──
  { classic: "الدجال", orbital: "الوهم / التزييف / الصوت الكاذب", meaning: "الصوت الكاذب اللي بيزيّن لك الباطل — مش مصطلح تراثي. (فاطر: ٨)" },
  { classic: "قتل", orbital: "مواجهة / كشف / تفكيك", meaning: "المواجهة الحاسمة بالحقيقة — مش القتل الجسدي. (النساء: ٧٦)" },
  { classic: "إسلامي / ديني", orbital: "اتصال بالمصدر / الحقيقة", meaning: "نقول 'الاتصال بالمصدر' مش 'ديني'. العقيدة المعرفية." },
];

export const TONE_GUARDRAILS = {
  avoidJudgmentLanguage: [
    "أنت مكتئب",
    "علاقة سامة",
    "أنت حساس زيادة",
    "اهدى",
    "استرخي وخلاص"
  ],
  preferCompanionLanguage: [
    "جسمك النهاردة محتاج هدوء",
    "العلاقة دي واخدة مساحة كبيرة من طاقتك",
    "خد مكانك في رحلتك",
    "خد نفس عميق",
    "الخطوات دي بتسحب من طاقتك"
  ],
  writingRules: [
    "وصف مش حكم. رحلة مش تشخيص.",
    "جمل قصيرة ودافئة وقلبها عليك.",
    "عامية مصرية بسيطة وحكيمة.",
    "لا تستخدم أي مصطلحات طبية أو معقدة.",
    "الأزرار = فعل بسيط (يلا بينا، كمل، سجل).",
    "ممنوع استخدام مصطلحات إنجليزية — استخدم البديل العربي من القاموس.",
    "المشهد الواحد في الاسكريبت لا يتعدى 17 كلمة.",
    "ممنوع: الدجال / قتل الدجال / إسلامي / ديني — راجع قاموس البدائل.",
  ]
} as const;

export function resolveVoiceMode(energy?: number | null): VoiceMode {
  if (typeof energy !== "number") return "wise_observer";
  if (energy <= 3) return "warm_healer";
  if (energy >= 8) return "gentle_companion";
  return "wise_observer";
}

export function getVoiceModeInstruction(mode: VoiceMode): string {
  if (mode === "warm_healer") {
    return "صوت الرفيق الدافي: احتواء هادي، بيطمنك وبيساعدك تلاقي نفسك.";
  }
  if (mode === "gentle_companion") {
    return "صوت الرفيق اللي بيشجع: دافئ ومباشر، خطوة واحدة بسيطة تقدر تعملها دلوقتي.";
  }
  return "صوت المراقب الحكيم: بيشوف الصورة بوضوح وبيوضحها ليك ببساطة من غير كلام كتير.";
}

export function buildOrbitalDictionaryBlock(): string {
  return ORBITAL_DICTIONARY.map((item) => `- ${item.classic} => ${item.orbital} (${item.meaning})`).join("\n");
}

export function buildToneSystemBlock(pulse?: PulseEntry | null): string {
  const mode = resolveVoiceMode(pulse?.energy ?? null);
  return [
    "**روح الرحلة (مبادئ ثابتة):**",
    "- الهوية: الرفيق (Refiq) - صديقك الحكيم في المشوار.",
    "- الدور: توضيح الطريق وتقديم خيارات بسيطة ليك.",
    "- اللغة: عامية مصرية بسيطة، دافئة، وفي صلب الموضوع.",
    "- القاعدة الذهبية: الرحلة رحلتك والقرار قرارك. إحنا بنساعدك تشوف بوضوح.",
    `- ${getVoiceModeInstruction(mode)}`,
    "- ممنوع: تشخيص، أحكام، أو كلام معقد.",
    "- البديل: دوشة في الدماغ / طاقة تقيلة / ارسم مسافتك / نقي مساحتك.",
    "**كلمات الرحلة:**",
    buildOrbitalDictionaryBlock()
  ].join("\n");
}

