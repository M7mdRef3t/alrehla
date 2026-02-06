import { geminiClient } from "../services/geminiClient";
import type { MapNode, PersonViewInsights } from "../modules/map/mapTypes";
import type { AdviceCategory } from "../data/adviceScripts";
import { PATH_NAMES } from "../modules/pathEngine/pathResolver";

interface AIDiagnosisResponse {
  diagnosisTitle?: string;
  diagnosisUnderstanding?: string;
  diagnosisSummary?: string;
  stateLabel?: string;
  goalAction?: string;
  understandingSubtext?: string;
  enemyExplanation?: string;
  symptomsInterpretation?: string;
  solutionSuggestions?: string;
  planHighlights?: string[];
}

function buildPersonSummary(node: MapNode, category: AdviceCategory, goalId?: string): string {
  const ring = node.ring;
  const recommendedRing = node.analysis?.recommendedRing;
  const detachment = node.detachmentMode ? "نعم" : "لا";
  const answers = node.analysis?.answers;
  const selectedSymptoms = node.analysis?.selectedSymptoms ?? [];
  const pathId = node.recoveryProgress?.pathId;
  const pathStage = node.recoveryProgress?.pathStage;
  const pathName = pathId ? PATH_NAMES[pathId] : undefined;
  const situationsCount = node.firstStepProgress
    ? Object.values(node.firstStepProgress.stepInputs)
        .flat()
        .filter((s) => s?.trim()).length
    : 0;

  const healthSummary = answers
    ? `إجابات قياس الاستنزاف: q1=${answers.q1}, q2=${answers.q2}, q3=${answers.q3}.`
    : "لا يوجد قياس استنزاف محفوظ.";

  const symptomsSummary =
    selectedSymptoms.length > 0
      ? `الأعراض التي اختارها المستخدم (IDs): ${selectedSymptoms.join(", ")}.`
      : "لم يحدد المستخدم أعراضاً بشكل صريح بعد.";

  const pathSummary = pathId
    ? `مسار التعافي الحالي: ${pathName ?? pathId} (المرحلة: ${pathStage ?? "غير محددة"}).`
    : "لم يتم تحديد مسار تعافي واضح بعد.";

  const situationsInfo =
    situationsCount > 0
      ? `عدد المواقف المكتوبة في التمرين الأول: ${situationsCount}.`
      : "لم يكتب المستخدم مواقف تفصيلية بعد، فالتشخيص يعتمد أكثر على الأسئلة المغلقة.";

  const contextSummary = goalId
    ? `سياق العلاقة/الهدف الحالي: ${goalId}, الفئة: ${category}.`
    : `الفئة الحالية: ${category}.`;

  return [
    `الشخص: ${node.label}`,
    `الدائرة الحالية على الخريطة (ring): ${ring}.`,
    recommendedRing ? `التوصية الآلية الحالية للدائرة: ${recommendedRing}.` : "لا توجد توصية آلية لدائرة أخرى حالياً.",
    `وضع فك الارتباط (detachmentMode / المنطقة الرمادية): ${detachment}.`,
    contextSummary,
    healthSummary,
    symptomsSummary,
    pathSummary,
    situationsInfo
  ].join("\n");
}

export async function generatePersonViewInsightsFromAI(
  node: MapNode,
  category: AdviceCategory,
  goalId?: string
): Promise<PersonViewInsights | null> {
  if (!geminiClient.isAvailable() || !node.analysis) return null;

  const summary = buildPersonSummary(node, category, goalId);

  const prompt = `أنت مستشار علاقات وحدود نفسية، بتشتغل بالعامية المصرية.

عندك البيانات التالية عن علاقة المستخدم مع الشخص:

${summary}

المطلوب:
- استخدم المعلومات دي «مع» القواعد الحالية مش ضدها.
- خليك ملتزم بالدائرة الحالية والتوصية الآلية؛ لو شايف تعليقات عليها، وضّحها في النص، بس متغيّرش القيم نفسها.

عايزين منك مخرجات منظمة تولّد شاشة النتيجة كاملة تقريباً:

1) عنوان مخصص للتشخيص (diagnosisTitle): جملة قصيرة تحط عنوان الشاشة، مثلاً "جسمك بعيد.. بس عقلك لسه هناك".
2) فهم الوضع (diagnosisUnderstanding): فقرة قصيرة تشرح بالعامية إيه اللي بيحصل في العلاقة للمستخدم.
3) ملخص تشخيص (diagnosisSummary): سطرين تلخيص عام ممكن نعرضهم كنظرة سريعة.
4) تسمية الحالة (stateLabel): كلمة/جملة قصيرة توصف الحالة (مثلاً: "استنزاف عن بُعد"، "محتاجة انتباه").
5) هدف العمل (goalAction): صياغة واضحة للهدف العملي في المرحلة دي (مثلاً: "فك الارتباط الشعوري"، "بناء درع حماية").
6) فقرة إضافية اختيارية (understandingSubtext): سطر/سطرين تحت «فهم الوضع» توضح زاوية مهمة (مثلاً: جسمك بعيد بس عقلك لسه هناك).
7) توضيح الحالة (enemyExplanation): فقرة تشرح بشكل مباشر مين العدو الحقيقي (الأفكار، الذنب، الخوف...) خاصة في حالات الاستنزاف عن بُعد.
8) تفسير الأعراض (symptomsInterpretation): فقرة قصيرة تلمّ الأعراض اللي ظهرت وتربطها ببعض.
9) اقتراح حل مخصص (solutionSuggestions): فقرة قصيرة أو نقاط سريعة تقول للمستخدم «هيتعامل إزاي» مع الشخص في المرحلة دي.
10) نقاط بارزة للخطة (planHighlights): 2–4 جمل قصيرة تلخّص اتجاه خطة التعافي مع الشخص ده.

أرجوك ارجع النتيجة في JSON فقط، بالشكل التالي:
\`\`\`json
{
  "diagnosisTitle": "عنوان قصير",
  "diagnosisUnderstanding": "شرح بالعامية",
  "diagnosisSummary": "ملخص التشخيص",
  "stateLabel": "تسمية الحالة",
  "goalAction": "الهدف العملي",
  "understandingSubtext": "فقرة إضافية تحت فهم الوضع",
  "enemyExplanation": "توضيح مباشر للحالة",
  "symptomsInterpretation": "تفسير الأعراض",
  "solutionSuggestions": "اقتراح الحل",
  "planHighlights": ["نقطة 1", "نقطة 2"]
}
\`\`\`

مهم:
- استخدم العامية المصرية البسيطة.
- متزودش نصائح عامة زيادة عن اللزوم؛ ركّز على الشخص والعلاقة دي بس.
- لو في بيانات ناقصة، اشتغل باللي متاح بس وخليك صريح إن الصورة مش كاملة.`;

  try {
    const result = await geminiClient.generateJSON<AIDiagnosisResponse>(prompt);
    if (!result) return null;

    const insights: PersonViewInsights = {
      diagnosisSummary: result.diagnosisSummary,
      diagnosisTitle: result.diagnosisTitle,
      diagnosisUnderstanding: result.diagnosisUnderstanding,
      stateLabel: result.stateLabel,
      goalAction: result.goalAction,
      understandingSubtext: result.understandingSubtext,
      enemyExplanation: result.enemyExplanation,
      symptomsInterpretation: result.symptomsInterpretation,
      solutionSuggestions: result.solutionSuggestions,
      planHighlights: result.planHighlights
    };

    return insights;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error generating AI person view insights:", error);
    }
    return null;
  }
}
