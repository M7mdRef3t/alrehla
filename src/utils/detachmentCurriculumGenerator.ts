import { geminiClient } from "../services/geminiClient";

/**
 * مولد مناهج فك الارتباط (المنطقة الرمادية) — شخصية معالج نفسي + سردي.
 * يستخدم Gemini لتوليد تشخيص عميق وخطة تمارين مخصصة.
 */

export interface DetachmentCurriculumItem {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  exercises: string[];
}

export interface DetachmentCurriculumResult {
  status_title: string;
  deep_explanation: string;
  goal_reframed: string;
  suggested_zone: string;
  custom_curriculum: DetachmentCurriculumItem[];
}

const PSYCHOLOGIST_SYSTEM = `أنت معالج نفسي وسردي (Psychologist & Narrative Therapist). دورك مش إنك تدي نصائح سطحية، بل إنك تكشف المستور: الفجوة بين "الواقع الموضوعي" و"ما يختبره المستخدم داخلياً". استخدم العامية المصرية. كن داعماً بدون لوم.`;

const STATIC_CURRICULA: DetachmentCurriculumItem[] = [
  {
    id: "guilt-detox",
    name: "Guilt Detox",
    nameAr: "التحرر من الذنب",
    description: "التفرقة بين الذنب الحقيقي (أذيت حد) والذنب المفتعل (خالفت توقعاتهم).",
    exercises: [
      "محكمة الضمير: لما تحس بذنب إنك مكلمتش، اسأل: «هل فيه قانون بيقول لازم تكلمها كل يوم؟ ولا ده قانون هي اللي حطته؟» كن أنت القاضي مش المتهم.",
      "ورقة القوانين: اكتب 3 «قوانين» اللي حدّتك إياها (مثلاً: لازم أردّ فوراً). جنب كل واحدة اكتب: «ده اختيار ولا التزام؟»"
    ]
  },
  {
    id: "emotional-fasting",
    name: "Emotional Fasting",
    nameAr: "الصيام الشعوري",
    description: "قطع «المخدر» اللي بييجي من التفكير فيها — لمدة 7 أيام.",
    exercises: [
      "قواعد الصيام: ممنوع مراقبة صور قديمة، ممنوع السؤال عنها بطريق غير مباشر، ممنوع «الحوارات التخيلية» (إنك تتخيل إنك بتعاتبها في دماغك).",
      "تتبع الأيام: علّم كل يوم نجحت فيه (حتى لو يوم واحد). الهدف مش الكمال، الهدف تقليل الجرعة."
    ]
  },
  {
    id: "stop-recall",
    name: "Stop the Recall",
    nameAr: "إيقاف الاستحضار",
    description: "كسر الدائرة العصبية اللي بتستدعي صورتها.",
    exercises: [
      "إشارة قف: أول ما صورتها تيجي في بالك، قول بصوت عالي: «مش هنا.. مش دلوقتي.» وقوم غيّر مكانك فوراً (مثلاً وقف، امشي خطوتين).",
      "تأجيل الاجترار: حدد 5 دقائق لاحقاً «وقت التفكير». لو الفكرة جت قبل كده، قلّها: «هفكر في الموضوع الساعة X.»"
    ]
  },
  {
    id: "cord-cutting",
    name: "Cord Cutting",
    nameAr: "فك التعلق",
    description: "استرداد الطاقة بتخيل قطع الحبل الطاقي.",
    exercises: [
      "تخيل حبل سُري طاقي طالع من منطقة المعدة وواصل للشخص. تخيل إنك بتقصه بحذر وبتربط «الجرح» بتاعك عشان النزيف الطاقي يوقف.",
      "بعد التمرين: اكتب جملة واحدة: «الطاقة اللي كانت رايحة هناك، دلوقتي راجعة ليّ.»"
    ]
  }
];

function buildPrompt(personLabel: string, symptomsSummary: string, contactReality: string): string {
  return `${PSYCHOLOGIST_SYSTEM}

**تحليل الفجوة (أعراض عالية + تواصل قليل):**
- الشخص: ${personLabel}
- الأعراض: ${symptomsSummary}
- واقع التواصل: ${contactReality}

**المهمة:** حلل الفجوة بين «أعراض عالية جداً» و«تواصل نادر/منعدم». الهدف مش «رسم حدود» (الحدود ممكن تكون موجودة أصلاً)، الهدف «فك الارتباط الشعوري» و«وقف المحكمة الداخلية».

**المطلوب (JSON فقط، بدون markdown تاني):**
- status_title: استخدم «استنزاف عن بُعد» أو مرادف قريب.
- deep_explanation: ابدأ بـ «لأن العدو مش [اسم الشخص] اللي برا، العدو هو [اسم الشخص] اللي جوه دماغك (الصوت الداخلي، الذنب، الخوف). أنت مسجون في التفكير فيها رغم إنها مش موجودة.» ويمكنك توسيع الجملة قليلاً.
- goal_reframed: ابدأ بأن الهدف مش «ترسم حدود» (الحدود مرسومة بكلمة نادراً)، الهدف إنه يبطل يحس بالذنب ويبطل يفكر قهرياً.

\`\`\`json
{
  "status_title": "استنزاف عن بُعد",
  "deep_explanation": "لأن العدو مش [الاسم] اللي برا، العدو هو [الاسم] اللي جوه دماغك (الصوت الداخلي، الذنب، الخوف). أنت مسجون في التفكير فيها رغم إنها مش موجودة.",
  "goal_reframed": "لأن الهدف مش أنك ترسم حدود (الحدود مرسومة بالفعل بكلمة نادراً). الهدف هو إنك تبطل تحس بالذنب تجاه الحدود دي، وتبطل تفكر فيها قهرياً.",
  "suggested_zone": "المنطقة الرمادية (منطقة التعافي)",
  "custom_curriculum": [
    {
      "id": "guilt-detox",
      "name": "Guilt Detox",
      "nameAr": "التحرر من الذنب",
      "description": "وصف قصير بالعربي",
      "exercises": ["تمرين 1 محدد", "تمرين 2 محدد"]
    },
    {
      "id": "emotional-fasting",
      "name": "Emotional Fasting",
      "nameAr": "الصيام الشعوري",
      "description": "وصف قصير",
      "exercises": ["قواعد الصيام 7 أيام", "تمرين تتبع"]
    },
    {
      "id": "stop-recall",
      "name": "Stop the Recall",
      "nameAr": "إيقاف الاستحضار",
      "description": "وصف قصير",
      "exercises": ["إشارة قف", "تأجيل الاجترار"]
    },
    {
      "id": "cord-cutting",
      "name": "Cord Cutting",
      "nameAr": "فك التعلق",
      "description": "وصف قصير",
      "exercises": ["تخيل قص الحبل", "جملة استرداد الطاقة"]
    }
  ]
}
\`\`\`

اجب بـ JSON فقط. استخدم العامية المصرية في كل الحقول.`;
}

export async function generateDetachmentCurriculum(
  personLabel: string,
  symptomsSummary: string = "استنزاف عالي (ذنب، خوف، إجهاد)",
  contactReality: string = "تواصل نادر أو منعدم"
): Promise<DetachmentCurriculumResult> {
  if (geminiClient.isAvailable()) {
    const prompt = buildPrompt(personLabel, symptomsSummary, contactReality);
    const result = await geminiClient.generateJSON<DetachmentCurriculumResult>(prompt);
    if (result?.status_title && result?.deep_explanation && result?.custom_curriculum?.length) {
      return result;
    }
  }
  return {
    status_title: "استنزاف عن بُعد",
    deep_explanation: `لأن العدو مش "${personLabel}" اللي برا، العدو هو "${personLabel}" اللي جوه دماغك (الصوت الداخلي، الذنب، الخوف). أنت مسجون في التفكير فيها رغم إنها مش موجودة.`,
    goal_reframed:
      "لأن الهدف مش أنك «ترسم حدود» (الحدود مرسومة بالفعل بكلمة «نادراً»). الهدف هو إنك تبطل تحس بالذنب تجاه الحدود دي، وتبطل تفكر فيها قهرياً.",
    suggested_zone: "المنطقة الرمادية (منطقة التعافي)",
    custom_curriculum: STATIC_CURRICULA
  };
}

/** نصوص صفحة النتيجة فقط — للاستخدام في ResultScreen (مع أو بدون AI) */
export interface DetachmentResultInsight {
  status_title: string;
  deep_explanation: string;
  goal_reframed: string;
}

export async function generateDetachmentResultInsight(
  personLabel: string
): Promise<DetachmentResultInsight | null> {
  const full = await generateDetachmentCurriculum(personLabel);
  if (!full) return null;
  return {
    status_title: full.status_title,
    deep_explanation: full.deep_explanation,
    goal_reframed: full.goal_reframed
  };
}

/** محكمة الضمير — إعادة صياغة جملة الذنب (من الـ AI أو ثابت) */
export async function reframeGuiltThought(
  userText: string,
  personLabel: string
): Promise<string | null> {
  if (!userText.trim()) return null;
  if (geminiClient.isAvailable()) {
    const prompt = `أنت «القاضي» في تمرين «محكمة الضمير». المستخدم كتب: «${userText.trim()}» (بخصوص ${personLabel}).

ردّ بجملة أو جملتين فقط، بالعامية المصرية، على نفس نمط: «هل فيه قانون بيقول لازم تكلمها كل يوم؟ ولا ده قانون هي اللي حطته؟ كن أنت القاضي مش المتهم.» — أي أعد صياغة الذنب لسؤال يفضح أن «القانون» من برا مش من ضميره. ردّ نص فقط بدون علامات اقتباس إضافية.`;
    const reply = await geminiClient.generate(prompt);
    if (reply?.trim()) return reply.trim();
  }
  return null;
}
