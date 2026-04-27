import { geminiClient } from "@/services/geminiClient";
import type { Ring } from "@/modules/map/mapTypes";
import type { AdviceCategory } from "@/data/adviceScripts";
import type { FeelingAnswers } from '@/modules/exploration/FeelingCheck';
import type { RealityAnswers } from '@/modules/exploration/RealityCheck';
import { feelingCopy } from "@/copy/feeling";
import { realityCopy } from "@/copy/reality";

export interface ResultScreenAIContent {
  title: string;
  state_label: string;
  goal_label: string;
  understanding_title: string;
  understanding_body: string;
  explanation_title: string;
  explanation_body: string;
  suggested_zone_title: string;
  suggested_zone_label: string;
  suggested_zone_body: string;
  aiGenerated: boolean;
}

export type UserToneGender = "male" | "female" | "neutral";
export type PersonGender = "male" | "female" | "unknown";

export interface ResultScreenAIInput {
  personLabel: string;
  personTitle?: string;
  personName?: string;
  personGender?: PersonGender;
  ring: Ring;
  score: number;
  goalLabel: string;
  category: AdviceCategory;
  contactLevel: "high" | "medium" | "low" | "none" | "unknown";
  isEmotionalCaptivity: boolean;
  isEmergency?: boolean;
  feelingAnswers?: FeelingAnswers;
  realityAnswers?: RealityAnswers;
  userToneGender?: UserToneGender;
}

function ringLabel(ring: Ring): string {
  return ring === "red" ? "استنزاف (حمراء)" : ring === "yellow" ? "تنبيه (صفراء)" : "أمان (خضراء)";
}

function contactLabel(level: ResultScreenAIInput["contactLevel"]): string {
  if (level === "high") return "تواصل عالي";
  if (level === "medium") return "تواصل متوسط";
  if (level === "low") return "تواصل منخفض";
  if (level === "none") return "لا يوجد تواصل فعلي";
  return "غير واضح";
}

function categoryLabel(category: AdviceCategory): string {
  if (category === "work") return "شغل";
  if (category === "family") return "عيلة";
  return "عام";
}

function toneLabel(tone?: UserToneGender): string {
  if (tone === "female") return "مؤنث";
  if (tone === "male") return "مذكر";
  return "محايد بدون تذكير/تأنيث";
}

function personGenderLabel(gender?: PersonGender): string {
  if (gender === "female") return "أنثى";
  if (gender === "male") return "ذكر";
  return "غير محدد";
}

function buildFeelingBlock(answers?: FeelingAnswers): string {
  if (!answers) return "غير متاح";
  return [
    `- ${feelingCopy.q1}: ${feelingCopy.options[answers.q1]}`,
    `- ${feelingCopy.q2}: ${feelingCopy.options[answers.q2]}`,
    `- ${feelingCopy.q3}: ${feelingCopy.options[answers.q3]}`
  ].join("\n");
}

function buildRealityBlock(answers?: RealityAnswers): string {
  if (!answers) return "غير متاح";
  return [
    `- ${realityCopy.q1}: ${realityCopy.options[answers.q1]}`,
    `- ${realityCopy.q2}: ${realityCopy.options[answers.q2]}`,
    `- ${realityCopy.q3}: ${realityCopy.options[answers.q3]}`
  ].join("\n");
}

export async function generateResultScreenAI(
  input: ResultScreenAIInput
): Promise<ResultScreenAIContent | null> {
  if (!geminiClient.isAvailable()) return null;

  const prompt = `أنت مساعد نفسي متخصص في منصة "الرحلة". المطلوب كتابة كل نصوص شاشة النتيجة بناءً على اختيارات المستخدم فقط.

◈ المحور الرأسي: البشر "مرايات" بتعكس جودة اتصال المستخدم بالمصدر (ربنا). كل استنزاف أفقي = عرض محتمل لانقطاع رأسي. استخدم: "ربنا"، "المصدر"، "السلام الداخلي". تجنب: "الدين"، "العبادة".

**السياق:**
- الشخص: ${input.personLabel}
- اللقب المختار: ${input.personTitle ?? "غير مذكور"}
- الاسم المختار (إن وُجد): ${input.personName ?? "غير مذكور"}
- جنس الشخص المضاف: ${personGenderLabel(input.personGender)}
- النتيجة العامة: ${ringLabel(input.ring)}
- درجة التأثير: ${input.score}/9
- الفئة: ${categoryLabel(input.category)}
- الهدف المختار: ${input.goalLabel}
- مستوى التواصل: ${contactLabel(input.contactLevel)}
- استنزاف عن بُعد: ${input.isEmotionalCaptivity ? "نعم" : "لا"}
- حالة طوارئ: ${input.isEmergency ? "نعم" : "لا"}
- صيغة مخاطبة المستخدم: ${toneLabel(input.userToneGender)}

**إجابات المستخدم — تأثير العلاقة:**
${buildFeelingBlock(input.feelingAnswers)}

**إجابات المستخدم — واقع التواصل:**
${buildRealityBlock(input.realityAnswers)}

**المطلوب:**
اكتب محتوى النتيجة بأسلوب عامية مصرية، واضح ومختصر، مع ربط كل جملة ببيانات المستخدم أعلاه.
استخدم عناوين الأقسام كما هي، ولا تغيّرها.
لا تضع اسم الشخص في العنوان الرئيسي (لأنه سيظهر أعلى الشاشة).
لو صيغة المخاطبة "محايد"، تجنّب التذكير/التأنيث المباشر (مثل: شايف/شايفة، بتحس/بتحسي).
خاطب المستخدم عن الشخص المضاف بصيغة تتماشى مع جنسه (هو/هي، له/لها). لو "غير محدد" تجنّب هو/هي.
خلي العنوان جملة قصيرة مختلفة عن نص "فهم الوضع" لتجنب التكرار.
لو قسم أقل أهمية، اكتب نص قصير يوضح السبب بدلاً من تركه فارغ.

**أخرج JSON فقط:**
\`\`\`json
{
  "title": "عنوان كبير مخصص",
  "state_label": "تسمية الحالة المختصرة",
  "goal_label": "صياغة الهدف بنَفَس شخصي",
  "understanding_title": "فهم الوضع",
  "understanding_body": "2-4 جمل مبنية على الإجابات",
  "explanation_title": "توضيح الحالة",
  "explanation_body": "2-3 جمل توضح الصورة",
  "suggested_zone_title": "المكان الصحيح المقترح",
  "suggested_zone_label": "اسم المنطقة المقترحة",
  "suggested_zone_body": "1-3 جمل نصيحة عملية",
  "aiGenerated": true
}
\`\`\`
`;

  const result = await geminiClient.generateJSON<ResultScreenAIContent>(prompt);
  if (
    !result?.title ||
    !result?.state_label ||
    !result?.goal_label ||
    !result?.understanding_title ||
    !result?.understanding_body ||
    !result?.explanation_title ||
    !result?.explanation_body ||
    !result?.suggested_zone_title ||
    !result?.suggested_zone_label ||
    !result?.suggested_zone_body
  ) {
    return null;
  }

  return {
    ...result,
    aiGenerated: true
  };
}
