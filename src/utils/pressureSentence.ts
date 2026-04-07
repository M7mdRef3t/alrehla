import type { MapNode, Ring } from "@/modules/map/mapTypes";
import type { ResultScenarioKey } from "./resultScreenTemplates";

type PressureSentenceTone = "danger" | "caution" | "steady";

export interface PressureSentenceSnapshot {
  tone: PressureSentenceTone;
  title: string;
  summary: string;
  sentence: string;
  reasoning: string; // The "Sovereign Logic" behind this specific sentence
  sourceLabel: string;
  copyText: string;
}

interface PressureSentenceInput {
  displayName: string;
  ring: Ring;
  scenarioKey?: ResultScenarioKey;
  node?: Pick<
    MapNode,
    "ring" | "isNodeArchived" | "detachmentMode" | "energyBalance" | "isEmergency"
  > | null;
}

export function derivePressureSentence(
  input: PressureSentenceInput
): PressureSentenceSnapshot | null {
  const { displayName, ring, node, scenarioKey } = input;
  const netEnergy = node?.energyBalance?.netEnergy ?? 0;

  // 1. EMERGENCY / SOS (The most extreme protection)
  if (node?.isEmergency || scenarioKey === "emergency") {
    const sentence = "أنا حالياً فاتح مساحة لنفسي للهدوء ومش هقدر أدخل في أي تواصل تفصيلي الفترة دي. لو فيه حاجة ضرورية جداً أرجو إرسالها في رسالة قصيرة وهرد لما أكون مستعد.";
    return {
      tone: "danger",
      title: "درع الحماية المطلقة",
      summary: `لأن ${displayName} يمثل خطراً استنزافياً حقيقياً، هذه الجملة تضع حداً فاصلاً ينهي التوقعات منه قبل أن يطالبك بشيء.`,
      sentence,
      reasoning: "بدل الرد على فعل هو بيعمله، أنت بتعلن وضعك الحالي 'أنا في مساحة هدوء'. ده بيمنع الطرف التاني من البدء في استدراجك لأي حوار أو محاكمة ذهنية.",
      sourceLabel: "بروتوكول SOS",
      copyText: sentence
    };
  }

  // 2. ARCHIVED / STEADY DISTANCE (Distance already established)
  if (node?.isNodeArchived) {
    const sentence = "أنا حابب أحافظ على المسافة الهادية اللي بيننا دلوقتي لأنها أنسب وضع ليا. أي تواصل ضروري ياريت يكون محدد وقصير جداً.";
    return {
      tone: "steady",
      title: "درع الحفاظ على المكتسبات",
      summary: `لو ظهر ضغط للرجوع إلى النمط القديم مع ${displayName}، هذه الجملة هي 'المرساة' التي تحمي المسافة التي بنيتها بصعوبة.`,
      sentence,
      reasoning: "الجملة دي بتعلن بوضوح إن المسافة الحالية هي 'اختيار' وليست صدفة، وده بيقفل الباب قدام أي محاولات لاستعادة السيطرة القديمة.",
      sourceLabel: "مرساة السيادة",
      copyText: sentence
    };
  }

  // 2. EMOTIONAL PRISONER (Breaking the mental loop)
  if (scenarioKey === "emotional_prisoner") {
    const sentence = "الوقت ده أنا بحترم فيه طاقتي ومحتاج أكون في حالة هدوء بعيداً عن أي نقاشات. أي تواصل ياريت يكون محدود وفي الضروريات بس.";
    return {
      tone: "danger",
      title: "درع فك الارتباط الاستباقي",
      summary: "عقلك متعلق بمحاكمات وهمية، هذه الجملة تحسم حدودك 'قبل' أن يحدث احتكاك حقيقي وتساعدك على تثبيت 'الصمت الداخلي'.",
      sentence,
      reasoning: "الجملة دي مش رد على 'حوار' قايم، دي 'إعلان موقف'. أنت بتقول إنك مش متاح للنقاشات، وده بيوقف استنزاف تفكيرك في 'يا ترى لو كلمني هقول إيه؟'.",
      sourceLabel: "تحليل سجين المدار",
      copyText: sentence
    };
  }

  // 4. ACTIVE BATTLEFIELD (Limiting operational exposure)
  if (scenarioKey === "active_battlefield" || netEnergy <= -5 || ring === "red") {
    const sentence = "أنا وقتي النهاردة ضيق جداً فخلينا نقتصر في تواصلنا على أهم حاجة محتاجين نخلصها عشان مش هقدر أطول في الكلام النهاردة.";
    return {
      tone: "danger",
      title: "درع الوقت المحدود",
      summary: `في احتكاكك مع ${displayName}، هذه الجملة ترسم 'خندقاً' زمنياً يحميك من البداية، سواء في مكالمة أو مقابلة.`,
      sentence,
      reasoning: "تحديد الوقت من الأول هو 'بتر استباقي'. أنت بتفرض قوانينك قبل ما هو يفرض سيطرته على وقتك وطاقتك باللوم أو العتاب.",
      sourceLabel: "بروتوكول الدرع",
      copyText: sentence
    };
  }

  // 4. EGGSHELLS (De-escalation / Diplomacy)
  if (scenarioKey === "eggshells" || ring === "yellow" || node?.detachmentMode) {
    const sentence = "الفترة دي وقتي مش ملكي بالكامل، فياريت نكتفي بالمراسلة لو فيه حاجة مهمة عشان أرد بوضوح لما أكون متاح.";
    return {
      tone: "caution",
      title: "درع التحول للدبلوماسية",
      summary: `لتحويل العلاقة مع ${displayName} لمسار رسمي ومتحكم فيه، هذه الجملة هي 'الفلتر' الذي يفصل بين احتياجه وبين راحتك.`,
      sentence,
      reasoning: "المراسلة بدل الكلام بتديك 'ثواني تفكير' إضافية قبل الرد. أنت هنا بتفرض 'بروتوكول تواصل' جديد بيحميك من الاستدراج العاطفي اللحظي.",
      sourceLabel: "تكتيك الدرع الرسمي",
      copyText: sentence
    };
  }


  return null;
}
