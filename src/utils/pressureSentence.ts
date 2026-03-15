import type { MapNode, Ring } from "../modules/map/mapTypes";

type PressureSentenceTone = "danger" | "caution" | "steady";

export interface PressureSentenceSnapshot {
  tone: PressureSentenceTone;
  title: string;
  summary: string;
  sentence: string;
  sourceLabel: string;
  copyText: string;
}

interface PressureSentenceInput {
  displayName: string;
  ring: Ring;
  node?: Pick<
    MapNode,
    "ring" | "isNodeArchived" | "detachmentMode" | "energyBalance" | "isEmergency"
  > | null;
}

export function derivePressureSentence(
  input: PressureSentenceInput
): PressureSentenceSnapshot | null {
  const { displayName, ring, node } = input;
  const netEnergy = node?.energyBalance?.netEnergy ?? 0;

  if (node?.isNodeArchived) {
    const sentence =
      "أحتاج أن تبقى المسافة كما هي الآن، لذلك لن أعود لنفس نمط التواصل القديم. إذا ظهر أمر ضروري فليكن التواصل مختصرًا وواضحًا.";

    return {
      tone: "steady",
      title: "جملة تحفظ المسافة",
      summary: `لو ظهر ضغط للرجوع إلى ${displayName} قبل أن تكون جاهزًا، استخدم هذه الصياغة بدل شرح طويل.`,
      sentence,
      sourceLabel: "قالب سريع",
      copyText: sentence
    };
  }

  if (node?.isEmergency || ring === "red" || netEnergy <= -5) {
    const sentence =
      "أحتاج مساحة الآن، ولن أدخل في هذا الحوار اليوم. إذا كان هناك أمر ضروري فأرسله في رسالة قصيرة وسأرد عندما أكون مستعدًا.";

    return {
      tone: "danger",
      title: "جملة تحميك الآن",
      summary: `لو حاول ${displayName} فتح نفس الحلقة، هذه صياغة قصيرة تحميك قبل أن تدخل في تبرير طويل.`,
      sentence,
      sourceLabel: "قالب سريع",
      copyText: sentence
    };
  }

  if (ring === "yellow" || node?.detachmentMode || netEnergy < 0) {
    const sentence =
      "الوقت الحالي لا يناسبني، وأحتاج أن يكون التواصل أخف وأوضح. إذا كان هناك شيء مهم فأرسله باختصار.";

    return {
      tone: "caution",
      title: "جملة تضبط القرب",
      summary: `لو بدأ الضغط يزيد مع ${displayName}، استخدم هذه الجملة لتخفيف الاحتكاك من غير تصعيد.`,
      sentence,
      sourceLabel: "قالب سريع",
      copyText: sentence
    };
  }

  return null;
}
