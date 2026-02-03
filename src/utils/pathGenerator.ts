/**
 * مولّد المسار من الذكاء الاصطناعي (Gemini).
 * عند تثبيت التشخيص يُستدعى لاستلام مسار تعافي مخصص (RecoveryPath) وتخزينه.
 */

import { geminiClient } from "../services/geminiClient";
import type { PathId, SymptomType } from "../modules/pathEngine/pathTypes";
import type { RecoveryPath } from "../modules/pathEngine/pathTypes";
import { PATH_NAMES } from "../modules/pathEngine/pathResolver";

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
  if (!geminiClient.isAvailable()) return null;

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
    if (result?.id && result?.phases?.week1) return result;
  } catch (e) {
    if (import.meta.env.DEV) console.warn("pathGenerator: Gemini failed", e);
  }
  return null;
}
