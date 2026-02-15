/**
 * مولّد المسار من الذكاء الاصطناعي (Gemini).
 * عند تثبيت التشخيص يُستدعى لاستلام مسار تعافي مخصص (RecoveryPath) وتخزينه.
 */

import { geminiClient } from "../services/geminiClient";
import type { PathId, SymptomType } from "../modules/pathEngine/pathTypes";
import type { RecoveryPath } from "../modules/pathEngine/pathTypes";
import { PATH_NAMES } from "../modules/pathEngine/pathResolver";
import { runtimeEnv } from "../config/runtimeEnv";

const PATH_DESCRIPTIONS: Record<PathId, string> = {
  path_protection: "مسرح الحدود الخارجية: المعركة بينك وبين الشخص. السلاح: لا، التجاهل، الوقت، المسافة. استنزاف نشط (احتكاك عالي). الهدف: وقف النزيف، حدود صارمة، فنون الرد البارد — «قول لا للغير».",
  path_detox: "مسرح الحدود الداخلية: المعركة بينك وبين نفسك (أفكارك/مشاعرك). السلاح: إيقاف الأفكار، تفكيك الذنب، الصيام الشعوري. استنزاف عن بُعد — العدو جوا الدماغ. الهدف: «قول لا لنفسك» — انضباط ذاتي، حدود مع أفكارك (مراقبة، اجترار، ذنب).",
  path_negotiation: "منطقة صفراء. الهدف: إدارة العلاقة بأقل خسائر، دبلوماسية عاطفية.",
  path_deepening: "منطقة خضراء. الهدف: تحويل العلاقة لمصدر قوة ودعم.",
  path_sos: "طوارئ. الهدف: الخروج الآمن، توجيه لجهات مختصة."
};

const SYMPTOM_TYPE_LABELS: Record<SymptomType, string> = {
  guilt: "ذنب و تبرير",
  fear: "قلق و تجنب",
  drain: "استنزاف و إرهاق",
  anger: "غضب مكبوت و توتر جسدي",
  mixed: "مزيج من المشاعر"
};

/** نوع العلاقة / الدور — عشان الـ AI يفرّق (أم = سلطة روحية) vs (مدير = سلطة مادية) */
export type RelationshipRole = "family" | "work" | "love" | "money" | "general" | "unknown";

const ROLE_LABELS: Record<RelationshipRole, string> = {
  family: "علاقة عائلية (سلطة روحية ممكنة: أم، أب، إلخ)",
  work: "علاقة عمل (سلطة مادية: مدير، زميل، عميل)",
  love: "علاقة عاطفية (شريك، خطيب، زوج/ة)",
  money: "علاقة مالية/اجتماعية",
  general: "علاقة عامة",
  unknown: "غير محدد"
};

export interface GeneratePathInput {
  personLabel: string;
  pathId: PathId;
  /** مرحلة حالية (اختياري) — للـ recalculating */
  stage?: string;
  /** آخر فشل أو صعوبة (اختياري) — عشان الـ AI يخفّف التمرين التالي */
  lastDifficulty?: string;
  /** نوع الألم السائد — عشان الـ AI يخصّص التمارين */
  symptomType?: SymptomType;
  /** دور العلاقة — عشان الـ AI يخصص (سلطة روحية vs مادية) */
  relationshipRole?: RelationshipRole;
}

/**
 * يستدعي Gemini لتوليد مسار تعافي (3 أسابيع) مخصص للشخص والمسار.
 * النتيجة تُخزَن في العقدة (recoveryPathSnapshot) وتُعرض يوم بيوم.
 */
export async function generateRecoveryPathFromAI(
  input: GeneratePathInput
): Promise<RecoveryPath | null> {
  const { personLabel, pathId, lastDifficulty, symptomType, relationshipRole } = input;
  if (!geminiClient.isAvailable()) {
    return buildFallbackRecoveryPath(input);
  }

  const pathName = PATH_NAMES[pathId];
  const pathDesc = PATH_DESCRIPTIONS[pathId];

  const symptomLine = symptomType
    ? `نوع الألم السائد عند المستخدم: ${SYMPTOM_TYPE_LABELS[symptomType]}. خصّص التمارين ليه.`
    : "";
  const roleLine = relationshipRole && relationshipRole !== "unknown"
    ? `نوع العلاقة/الدور: ${ROLE_LABELS[relationshipRole]}. راعِ الفرق بين السلطة الروحية (عيلة) والسلطة المادية (شغل) في صياغة التمارين.`
    : "";

  const philosophyRule =
    pathId === "path_detox"
      ? `
**الجذر النفسي: ذنب الحدود (Boundary Guilt)**
المشكلة مش في «الشخص»، المشكلة في «الفعل» — المستخدم بيشوف «الحد» كجريمة أو عقوق أو قسوة، مش كحق. الهدف: تغيير تعريف الحد في عقله — «الحدود مش عقاب للآخرين، الحدود صيانة لنفسي.»

**تمييز:** ذنب علائقي (أذيت ماما) ≠ ذنب الحدود (أنا شخص سيء لأن عندي قواعد). ركّز على التاني.

**استراتيجية التدخل:**
- عادّل الحد: عامله كأداة صحية محايدة (زي الباب أو الجلد)، مش سلاح.
- صدّق الحاجة: «أنت مش بتتجاهلها، أنت بتمنع استنزافك.»
- غيّر التركيز: من «إحساسها تجاه الحد» إلى «الحد بيخليك إزاي فعّال.»

**تمارين شرعنة الحدود (أدرجها في الأسابيع):**
1) إعادة تسمية: بدل «تجاهل» → «شحن طاقة»؛ بدل «عقوق» → «حماية مساحتي». تغيير الاسم بيغيّر الشعور.
2) محامي الدفاع: «لو صاحبك قفل موبايله عشان يرتاح، هتشوفه سيء؟» → «يبقى ليه بتشوف نفسك سيء لما تعمل نفس الحاجة؟»
3) ألم مش أذى: «ممكن الحد يسبب للطرف التاني ألم (يتضايق شوية) بس مش أذى (ضرر حقيقي).» الهدف: يبطل يحس إنه «مؤذي» لمجرد إنه حط حد.

كل التمارين صِيغها كـ «رسم حد مع أفكارك» و«شرعنة الحد» — انضباط ذاتي مش هروب.
`
      : pathId === "path_protection"
        ? `
قاعدة محتوى مسار «الحدود الخارجية»: التمارين تركّز على قول «لا» للشخص — التحكم في الوصول، الوقت، المسافة الجسدية. فنون الرد البارد، التجاهل الآمن، رسم حدود واضحة مع الطرف الآخر.
`
        : "";

  const prompt = `أنت مهندس منهج تعافي نفسي. الفلسفة الأساسية: **كل التعافي حدود** — إما حدود خارجية (مع الشخص) أو حدود داخلية (مع النفس).

المستخدم في المسار: «${pathName}».
الوصف: ${pathDesc}
الشخص المعني: ${personLabel}
${philosophyRule}${roleLine ? roleLine + "\n" : ""}${symptomLine ? symptomLine + "\n" : ""}${lastDifficulty ? `ملاحظة: المستخدم واجه صعوبة مؤخراً (${lastDifficulty}). خفّف تمرين اليوم التالي واجعل فيه «تنفس واحتواء» بدل تحدي قاسي.\n` : ""}

المطلوب: أنشئ خطة 3 أسابيع (JSON فقط، بدون markdown إضافي).
\`\`\`json
{
  "id": "${pathId}",
  "name": "${pathName}",
  "nameAr": "${pathName}",
  "description": "جملة واحدة بالعربي تصف المسار",
  "phases": {
    "week1": {
      "week": 1,
      "focus": "عنوان الأسبوع الأول",
      "description": "وصف قصير",
      "tasks": [
        {
          "id": "w1-t1",
          "type": "reflection",
          "title": "عنوان المهمة",
          "text": "وصف المهمة بالعربي",
          "helpText": "نصيحة اختيارية",
          "requiresInput": false,
          "difficultyHint": 2
        }
      ],
      "successCriteria": "كيف أعرف أنني نجحت؟"
    },
    "week2": { "week": 2, "focus": "", "description": "", "tasks": [], "successCriteria": "" },
    "week3": { "week": 3, "focus": "", "description": "", "tasks": [], "successCriteria": "" }
  },
  "aiAdjustmentFactor": 1
}
\`\`\`

استخدم العامية المصرية. كل أسبوع 2–4 مهام. نوع المهمة: reflection أو writing أو practice أو breathing.`;

  try {
    const result = await geminiClient.generateJSON<RecoveryPath>(prompt);
    if (result?.id && result?.phases?.week1) return { ...result, aiGenerated: true };
  } catch (e) {
    if (runtimeEnv.isDev) console.warn("pathGenerator: Gemini failed", e);
  }
  return buildFallbackRecoveryPath(input);
}

function buildFallbackRecoveryPath(input: GeneratePathInput): RecoveryPath {
  const { personLabel, pathId } = input;
  const name = PATH_NAMES[pathId];
  const description = PATH_DESCRIPTIONS[pathId];

  const commonWeek = (week: number, focus: string, tasks: RecoveryPath["phases"]["week1"]["tasks"]): RecoveryPath["phases"]["week1"] => ({
    week,
    focus,
    description: `أسبوع ${week}: خطوات بسيطة قابلة للتنفيذ مع ${personLabel}.`,
    tasks,
    successCriteria: "إنجزت المهام الأساسية وشعرت بفرق بسيط في وضوحك وحدودك."
  });

  const pathTasks: Record<PathId, { week1: RecoveryPath["phases"]["week1"]["tasks"]; week2: RecoveryPath["phases"]["week2"]["tasks"]; week3: RecoveryPath["phases"]["week3"]["tasks"]; }> = {
    path_protection: {
      week1: [
        { id: "w1-t1", type: "reflection", title: "رسم حدود واضحة", text: "اكتب 3 حدود مش هتتجاوزها مع الشخص ده.", requiresInput: true, placeholder: "مثال: مش هرد بعد الساعة 10..." },
        { id: "w1-t2", type: "practice", title: "قول لأ صغيرة", text: "اختار موقف بسيط وقل فيه لأ مرة واحدة.", requiresInput: true, placeholder: "الموقف اللي قلت فيه لأ..." },
        { id: "w1-t3", type: "breathing", title: "تهدئة قبل الرد", text: "تنفس 60 ثانية قبل أي رد صعب.", requiresInput: false }
      ],
      week2: [
        { id: "w2-t1", type: "writing", title: "نص رد جاهز", text: "اكتب رد قصير ومحترم تقدر تستخدمه وقت الضغط.", requiresInput: true, placeholder: "مثال: مقدرش دلوقتي، ممكن بكرة." },
        { id: "w2-t2", type: "observation", title: "لاحظ ضغط الجسم", text: "سجّل إحساس جسمك بعد كل تواصل.", requiresInput: true, placeholder: "بعد المكالمة حسيت..." }
      ],
      week3: [
        { id: "w3-t1", type: "challenge", title: "حد نهائي", text: "نفّذ حد واحد كنت بتأجله.", requiresInput: true, placeholder: "الحد اللي نفذته..." },
        { id: "w3-t2", type: "reflection", title: "إعادة تقييم", text: "قيّم علاقتك بعد الحدود الجديدة (جملة واحدة).", requiresInput: true, placeholder: "دلوقتي شايف العلاقة..." }
      ]
    },
    path_detox: {
      week1: [
        { id: "w1-t1", type: "reflection", title: "تمييز الذنب", text: "اكتب 3 أفكار ذنب تطاردك وسمّيها \"ذنب حدود\".", requiresInput: true, placeholder: "مثال: عندما أقول لا، أشعر أنني أنانية" },
        { id: "w1-t2", type: "practice", title: "وقف الاستحضار", text: "كل ما تفكر فيه، قول لنفسك: \"ده مش وقت التفكير\".", requiresInput: false },
        { id: "w1-t3", type: "breathing", title: "تهدئة الذهن", text: "تنفس 90 ثانية لما يشتغل الاجترار.", requiresInput: false }
      ],
      week2: [
        { id: "w2-t1", type: "writing", title: "قاضي الحدود", text: "اكتب سؤالين يفضحوا الذنب (هل في قانون؟)", requiresInput: true, placeholder: "هل فيه قانون بيقول..." },
        { id: "w2-t2", type: "observation", title: "سجل الاجترار", text: "سجّل كل مرة استحضرت الشخص خلال اليوم.", requiresInput: true, placeholder: "عدد المرات..." }
      ],
      week3: [
        { id: "w3-t1", type: "challenge", title: "صيام شعوري ليوم واحد", text: "يوم واحد بلا استحضار متعمّد (اكتب نتيجتك).", requiresInput: true, placeholder: "النتيجة..." },
        { id: "w3-t2", type: "reflection", title: "رسالة لنفسك", text: "اكتب رسالة قصيرة تثبّت حقك في الحدود.", requiresInput: true, placeholder: "أنا من حقي..." }
      ]
    },
    path_negotiation: {
      week1: [
        { id: "w1-t1", type: "reflection", title: "أين التوتر؟", text: "حدد أكثر نقطتين بيوجعوك في العلاقة.", requiresInput: true, placeholder: "أكتر نقطتين..." },
        { id: "w1-t2", type: "practice", title: "تواصل واضح", text: "جرّب جملة واضحة عن احتياجك.", requiresInput: true, placeholder: "مثال: محتاج شوية مساحة." }
      ],
      week2: [
        { id: "w2-t1", type: "writing", title: "سيناريو بديل", text: "اكتب رد بديل محترم لموقف متكرر.", requiresInput: true, placeholder: "لو حصل كذا، هقول..." },
        { id: "w2-t2", type: "observation", title: "قياس رد الفعل", text: "لاحظ رد الطرف الآخر بعد الجملة الجديدة.", requiresInput: true, placeholder: "رد الفعل كان..." }
      ],
      week3: [
        { id: "w3-t1", type: "challenge", title: "تفاوض بسيط", text: "جرّب تفاوض واحد يخفف الضغط.", requiresInput: true, placeholder: "التفاوض كان..." },
        { id: "w3-t2", type: "reflection", title: "تقييم التوازن", text: "هل التوازن اتحسن؟ اكتب جملة.", requiresInput: true, placeholder: "أيوه/لا لأن..." }
      ]
    },
    path_deepening: {
      week1: [
        { id: "w1-t1", type: "reflection", title: "نقطة قوة", text: "اكتب موقف واحد حسّسك بالأمان.", requiresInput: true, placeholder: "الموقف..." },
        { id: "w1-t2", type: "practice", title: "تعزيز القرب", text: "قول كلمة تقدير صريحة.", requiresInput: true, placeholder: "الكلمة..." }
      ],
      week2: [
        { id: "w2-t1", type: "writing", title: "اتفاق بسيط", text: "اتفقوا على عادة صغيرة ثابتة.", requiresInput: true, placeholder: "الاتفاق..." },
        { id: "w2-t2", type: "observation", title: "أثر الاتفاق", text: "لاحظ أثر العادة على إحساسك.", requiresInput: true, placeholder: "الأثر..." }
      ],
      week3: [
        { id: "w3-t1", type: "challenge", title: "خطوة تعميق", text: "جرّب خطوة جديدة تقوّي العلاقة.", requiresInput: true, placeholder: "الخطوة..." },
        { id: "w3-t2", type: "reflection", title: "تثبيت الاستمرار", text: "اكتب جملة تثبت العادة الجديدة.", requiresInput: true, placeholder: "هنستمر لأن..." }
      ]
    },
    path_sos: {
      week1: [
        { id: "w1-t1", type: "reflection", title: "أمانك أولاً", text: "اكتب خطة أمان سريعة (مين هتكلم؟ فين؟).", requiresInput: true, placeholder: "هكلم..." },
        { id: "w1-t2", type: "practice", title: "مسافة فورية", text: "احمِ نفسك بمسافة مؤقتة فوراً.", requiresInput: true, placeholder: "الخطوة..." }
      ],
      week2: [
        { id: "w2-t1", type: "writing", title: "توثيق بسيط", text: "اكتب ملخصًا واضحًا لما يحدث.", requiresInput: true, placeholder: "ملخص..." },
        { id: "w2-t2", type: "observation", title: "طلب دعم", text: "حدّد شخص دعم واحد على الأقل.", requiresInput: true, placeholder: "شخص الدعم..." }
      ],
      week3: [
        { id: "w3-t1", type: "challenge", title: "خروج آمن", text: "نفّذ خطوة خروج آمنة (لو لزم).", requiresInput: true, placeholder: "الخطوة..." },
        { id: "w3-t2", type: "reflection", title: "تثبيت الأمان", text: "اكتب كيف ستمنع تكرار الخطر.", requiresInput: true, placeholder: "هأمن نفسي بـ..." }
      ]
    }
  };

  const tasks = pathTasks[pathId];

  return {
    id: pathId,
    name,
    nameAr: name,
    description,
    phases: {
      week1: commonWeek(1, "خطوات تأسيسية", tasks.week1),
      week2: commonWeek(2, "تثبيت الحدود", tasks.week2),
      week3: commonWeek(3, "ترسيخ السلوك", tasks.week3)
    },
    aiAdjustmentFactor: 1,
    aiGenerated: false
  };
}
