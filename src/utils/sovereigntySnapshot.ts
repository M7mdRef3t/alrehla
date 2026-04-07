import type { MapNode, Ring } from "@/modules/map/mapTypes";

type SnapshotTone = "danger" | "caution" | "safe" | "steady";

export interface SovereigntySnapshot {
  tone: SnapshotTone;
  headline: string;
  body: string;
  ctaLabel: string;
  sourceLabel: string;
  reasons: string[];
}

interface SovereigntySnapshotInput {
  displayName: string;
  ring: Ring;
  node?: Pick<
    MapNode,
    "ring" | "isNodeArchived" | "isPowerBank" | "detachmentMode" | "energyBalance" | "missionProgress"
  > | null;
  isEmotionalPrisoner?: boolean;
  completedSteps?: number;
  totalSteps?: number;
}

function formatEnergyReason(netEnergy: number | null): string | null {
  if (netEnergy == null || !Number.isFinite(netEnergy) || netEnergy === 0) return null;
  return `صافي الطاقة ${netEnergy > 0 ? `+${netEnergy}` : String(netEnergy)}`;
}

function buildMissionReason(completedSteps: number, totalSteps: number, missionStarted: boolean): string {
  if (!missionStarted) return "المسار لم يبدأ بعد";
  if (totalSteps <= 0) return "فيه خطوة حماية مفتوحة";
  return `التقدم ${completedSteps}/${totalSteps}`;
}

export function deriveSovereigntySnapshot(input: SovereigntySnapshotInput): SovereigntySnapshot {
  const {
    displayName,
    ring,
    node,
    isEmotionalPrisoner = false,
    completedSteps = 0,
    totalSteps = 0
  } = input;
  const missionStarted = Boolean(node?.missionProgress?.startedAt);
  const netEnergy = node?.energyBalance?.netEnergy ?? null;
  const energyReason = formatEnergyReason(netEnergy);

  if (node?.isNodeArchived) {
    return {
      tone: "steady",
      headline: `قرارك الآن: اترك ${displayName} خارج المدار`,
      body: "العلاقة متوقفة الآن، والأولوية ليست إعادة فتحها بل تثبيت المسافة حتى يظهر سبب واضح وآمن.",
      ctaLabel: "أبقها في الأرشيف",
      sourceLabel: "قالب سيادي",
      reasons: ["العلاقة مؤرشفة", "المساحة محمية"]
    };
  }

  if (ring === "red" || isEmotionalPrisoner || (netEnergy != null && netEnergy <= -5)) {
    return {
      tone: "danger",
      headline: `قرارك الآن: احمِ مسافتك من ${displayName}`,
      body: missionStarted
        ? "لا تدخل نقاشًا جديدًا قبل إكمال خطوة الحماية المفتوحة. المطلوب الآن تقليل القرب لا تفسيره."
        : "ابدأ أول خطوة حماية قبل أي تواصل جديد. المطلوب الآن تقليل القرب لا تفسيره.",
      ctaLabel: missionStarted ? "كمّل خطوة الحماية" : "ابدأ خطوة الحماية",
      sourceLabel: "قالب سيادي",
      reasons: [
        isEmotionalPrisoner ? "تعلق عاطفي قائم" : "المدار أحمر",
        ...(energyReason ? [energyReason] : []),
        buildMissionReason(completedSteps, totalSteps, missionStarted)
      ].slice(0, 3)
    };
  }

  if (ring === "yellow" || node?.detachmentMode) {
    return {
      tone: "caution",
      headline: `قرارك الآن: خفف القرب واضبط شرطًا واحدًا مع ${displayName}`,
      body: missionStarted
        ? "كمّل الحد الناعم المفتوح الآن. الهدف هو تقليل الاحتكاك قبل أن يتحول الضغط إلى استنزاف."
        : "ابدأ بحد ناعم واحد فقط. الهدف هو تقليل الاحتكاك قبل أن يتحول الضغط إلى استنزاف.",
      ctaLabel: missionStarted ? "كمّل الحد الناعم" : "ابدأ حدًا ناعمًا",
      sourceLabel: "قالب سيادي",
      reasons: [
        "المدار أصفر",
        ...(energyReason ? [energyReason] : []),
        buildMissionReason(completedSteps, totalSteps, missionStarted)
      ].slice(0, 3)
    };
  }

  if (node?.isPowerBank) {
    return {
      tone: "safe",
      headline: `قرارك الآن: استخدم ${displayName} كمرسى آمن`,
      body: "العلاقة مشحونة بأمان حقيقي. اسمح لها أن تدعمك بدل ما تفتح مدارًا أكثر ضغطًا.",
      ctaLabel: "حافظ على القرب الآمن",
      sourceLabel: "قالب سيادي",
      reasons: ["المدار أخضر", "بطارية طوارئ بشرية", ...(energyReason ? [energyReason] : [])].slice(0, 3)
    };
  }

  return {
    tone: "safe",
    headline: `قرارك الآن: حافظ على القرب الصحي مع ${displayName}`,
    body: missionStarted
      ? "العلاقة مستقرة. كمّل ما بدأته بدون مبالغة في الفتح أو الانسحاب."
      : "العلاقة مستقرة. المطلوب فقط الحفاظ على المسافة الصحية كما هي.",
    ctaLabel: missionStarted ? "كمّل التثبيت" : "ثبّت هذا المدار",
    sourceLabel: "قالب سيادي",
    reasons: ["المدار أخضر", ...(energyReason ? [energyReason] : ["الطاقة مستقرة"])].slice(0, 3)
  };
}
