/**
 * حل مخصص للشخص بناءً على التشخيص والحالة والهدف — من الذكاء الاصطناعي.
 */
import { geminiClient } from "../services/geminiClient";

export interface PersonSolutionInput {
  personLabel: string;
  personalizedTitle: string;
  stateLabel: string;
  goalAction: string;
  understanding: string;
  isEmotionalCaptivity: boolean;
  understandingSubtext?: string;
}

const SYSTEM = `أنت مستشار علاقات وحدود نفسية. دورك: بعد ما تفهم التشخيص والحالة والهدف، تقدم **حل مخصص** لهذا الشخص فقط (مش نصائح عامة).
- استخدم العامية المصرية.
- الحل يكون خطوات عملية واضحة، مرتبطة بالتشخيص والهدف.
- لو الحالة "استنزاف عن بُعد": ركّز على فك الارتباط الشعوري والحدود مع الأفكار (مش مع الشخص).
- لو استنزاف عادي: ركّز على المسافة والحدود الواضحة.
- اكتب النص جاهز للعرض (فقرة أو نقاط)، بدون عناوين فرعية زائدة.`;

function buildPrompt(input: PersonSolutionInput): string {
  return `${SYSTEM}

**البيانات:**
- الشخص: ${input.personLabel}
- عنوان الحالة: ${input.personalizedTitle}
- الحالة: ${input.stateLabel}
- الهدف: ${input.goalAction}
- فهم الوضع: ${input.understanding}
${input.understandingSubtext ? `- توضيح إضافي: ${input.understandingSubtext}` : ""}
- استنزاف عن بُعد؟ ${input.isEmotionalCaptivity ? "نعم" : "لا"}

**المطلوب:** اكتب حل مخصص لهذا الشخص فقط (3–7 نقاط أو فقرات قصيرة)، مرتبط بالتشخيص والهدف. بدون مقدمة طويلة — ابدأ بالحل مباشرة.`;
}

/** توليد محلي في المتصفح — نفس المدخلات، نصوص مخصصة بالشخص والهدف (بدون API). */
function generatePersonSolutionLocal(input: PersonSolutionInput): string {
  const { personLabel, stateLabel, goalAction, isEmotionalCaptivity } = input;
  const name = personLabel.trim() || "الشخص";

  if (isEmotionalCaptivity) {
    return `• الهدف مع ${name} مش إنك ترسم حدود (الحدود مرسومة فعلاً). الهدف إنك تبطل تحس بالذنب وتبطل تفكر فيها قهرياً.

• محكمة الضمير: لو حاسس بذنب إنك مكلمتش، اسأل نفسك: «هل فيه قانون بيقول لازم أكلمها؟ ولا ده قانون هي اللي حطته؟» كن أنت القاضي مش المتهم.

• إشارة قف: أول ما صورتها تيجي في بالك، قول: «مش هنا.. مش دلوقتي» وغيّر مكانك أو شغّلك فوراً.

• الصيام الشعوري: ممنوع مراقبة صور قديمة أو السؤال عنها. تتبع الأيام اللي نجحت فيها — الهدف تقليل الجرعة مش الكمال.

• الطاقة اللي كانت رايحة هناك، رجّعها ليك: تخيل إنك بتقص حبل طاقي واصِل بينك وبينها، وبتربط «الجرح» عشان النزيف يوقف.`;
  }

  if (stateLabel.includes("استنزاف")) {
    return `• مع ${name} محتاج مسافة أكبر وحدود واضحة. قلّل التوصل لأقل حد (مرة كل أسبوعين أو أقل إن أمكن).

• لو محتاج تتواصل، خليها مكالمات قصيرة (ربع ساعة كحد أقصى) وأماكن عامة أفضل من خاصة.

• متشاركش تفاصيل شخصية عن حياتك — خلي التواصل سطحي ومشروط بالاحترام.

• لو الاستنزاف زاد، فكّر في تقليل أكثر أو القطع التام. التغيير محتاج وقت وثبات؛ أي تنازل ممكن يرجعك للدائرة الحمراء.`;
  }

  if (stateLabel.includes("انتباه") || stateLabel.includes("مشروط")) {
    return `• علاقتك مع ${name} محتاجة ضبط. حدد مع نفسك حدود واضحة قبل ما تدخل في مواقف صعبة.

• ركّز على الهدف: ${goalAction}. خلي الحدود تخدم الهدف ده مش تعقّد العلاقة.

• لو حصل تجاوز، راجع الحد مع نفسك ولو محتاج قلّل التوصل شوية.`;
  }

  return `• علاقتك مع ${name} حالياً في نطاق صحي. استمر في الحفاظ على الحدود الواضحة والاحترام المتبادل.

• الهدف: ${goalAction}. خليك واعي بأي تغيير في الشعور أو السلوك عشان تتدخل في الوقت المناسب.`;
}

/**
 * يولد حل مخصص: من الـ API لو متاح، وإلا توليد محلي في المتصفح (فترة تجريب حتى شراء الـ API).
 */
export async function generatePersonSolution(input: PersonSolutionInput): Promise<string | null> {
  if (geminiClient.isAvailable()) {
    const prompt = buildPrompt(input);
    const result = await geminiClient.generate(prompt);
    if (result?.trim()) return result.trim();
  }
  return generatePersonSolutionLocal(input);
}
