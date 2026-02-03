/**
 * عقد بيانات نافذة الشخص — التبويبات الأربعة (تشخيص، أعراض، حل، خطة) تتغذى من هنا.
 * مصدر البيانات: node + قاعدة ثابتة. عند إضافة AI نملأ insights في analysis والدمج يحدث هنا من غير تغيير المعمار.
 */
import type { MapNode, Ring } from "../map/mapTypes";
import type { AdviceCategory } from "../../data/adviceScripts";
import { getGoalAction } from "../../copy/goalPicker";

export type ResultTabId = "diagnosis" | "symptoms" | "solution" | "plan";

/** بيانات تبويب التشخيص — مطابق لهيكل شاشة النتيجة في AddPersonModal */
export interface DiagnosisPayload {
  zone: Ring;
  stateLabel: string;
  recommendedLabel: string | null;
  hasMismatch: boolean;
  goalAction: string;
  personalizedTitle: string;
  understanding: string;
  /** استنزاف عن بُعد — جسم بعيد، عقل عالق */
  isEmotionalCaptivity: boolean;
  /** فقرة إضافية تحت فهم الوضع (استنزاف عن بُعد أو lowContact أحمر) */
  understandingSubtext?: string;
  /** توضيح الحالة — العدو جوه دماغك (عند استنزاف عن بُعد) */
  enemyExplanation?: string;
  /** عرض قسم توضيح الحالة + المكان الصحيح */
  showDetachmentSections: boolean;
  diagnosisSummary?: string;
}

/** بيانات تبويب الأعراض — المكون SymptomsChecklist يستهلكها + onSymptomsChange */
export interface SymptomsPayload {
  ring: Ring;
  personLabel: string;
  selectedSymptoms: string[];
  /** اختياري من AI */
  symptomsInterpretation?: string;
}

/** بيانات تبويب الحل — المكون SuggestedPlacement يستهلكها */
export interface SolutionPayload {
  currentRing: Ring;
  personLabel: string;
  category: AdviceCategory;
  selectedSymptoms: string[] | undefined;
  /** اختياري من AI — نص إضافي أو بديل */
  solutionSuggestions?: string;
}

/** بيانات تبويب الخطة — المكون RecoveryRoadmap + أزرار الخطوة الأولى تستهلكها */
export interface PlanPayload {
  personLabel: string;
  hasAnalysis: boolean;
  hasSelectedSymptoms: boolean;
  hasWrittenSituations: boolean;
  /** عدد المواقف المكتوبة (لعداد X/2) */
  situationsCount: number;
  hasCompletedTraining: boolean;
  completedRecoverySteps: number;
  totalRecoverySteps: number;
  journeyStartDate: number | undefined;
  canShowRecoveryPlan: boolean;
  /** معاينة الخطة — تُعرض عندما المواقف أقل من 2 لتفادي إحباط المستخدم */
  canShowPlanPreview: boolean;
  /** اختياري من AI — نقاط بارزة تُعرض فوق أو تحت الخطة */
  planHighlights?: string[];
}

/** عقد بيانات كامل لنافذة الشخص — واضح، قابل للتوسع، يتغذى بـ AI من غير تغيير المعمار */
export interface PersonViewData {
  diagnosis: DiagnosisPayload;
  symptoms: SymptomsPayload;
  solution: SolutionPayload;
  plan: PlanPayload;
}

const stateLabelsBase: Record<Ring, string> = {
  green: "صحية",
  yellow: "محتاجة انتباه",
  red: "استنزاف"
};

const recommendedLabels: Record<Ring, string> = {
  green: "قرب صحي",
  yellow: "محتاجة انتباه",
  red: "استنزاف"
};

const STATIC_ENEMY_EXPLANATION = (name: string) =>
  `لأن العدو مش "${name}" اللي برا، العدو هو "${name}" اللي جوه دماغك (الصوت الداخلي، الذنب، الخوف). أنت مسجون في التفكير فيها رغم إنها مش موجودة.`;

function getUnderstanding(personLabel: string, zone: Ring, isEmotionalCaptivity: boolean): string {
  if (zone === "red") {
    if (isEmotionalCaptivity)
      return "إجاباتك بتقول إنك نجحت تبعد بجسمك (تواصل نادر)، لكن لسه بتدفع التمن من طاقتك وتفكيرك. المشكلة دلوقتي مش في «المقابلة»، المشكلة في «الفكرة» وفي شعور الذنب اللي بيطاردك.";
    return `علاقتك مع ${personLabel} بتاخد منك أكتر مما بتديك. جسمك بيحذرك - اسمع له.`;
  }
  if (zone === "yellow")
    return `في أنماط مش صحية في علاقتك مع ${personLabel} محتاجة انتباه. الحدود هتحميك.`;
  return `علاقتك مع ${personLabel} صحية ومتوازنة. حافظ عليها واستمر.`;
}

function getPersonalizedTitle(personLabel: string, zone: Ring, isEmotionalCaptivity: boolean): string {
  if (zone === "red") {
    if (isEmotionalCaptivity) return "جسمك بعيد.. بس عقلك لسه هناك";
    return `قربك من "${personLabel}" مؤلم ومحتاج مسافة فوراً`;
  }
  if (zone === "yellow") return `علاقتك مع "${personLabel}" محتاجة ضبط`;
  return `علاقتك مع "${personLabel}" صحية وآمنة`;
}

/**
 * يبني بيانات نافذة الشخص من node + category + goalId.
 * لو node.analysis.insights موجودة (من AI) تُدمج في الـ payloads دون تغيير هيكل التبويبات.
 */
export function getPersonViewData(
  node: MapNode,
  category: AdviceCategory,
  goalId: string | undefined
): PersonViewData {
  const zone = node.ring;
  const analysis = node.analysis!;
  const insights = analysis.insights;
  const isEmotionalCaptivity = zone === "red" && !!node.detachmentMode;
  const stateLabel = isEmotionalCaptivity ? "استنزاف عن بُعد" : stateLabelsBase[zone];
  const goalAction = isEmotionalCaptivity ? "فك الارتباط الشعوري" : getGoalAction(goalId);
  const understanding = getUnderstanding(node.label, zone, isEmotionalCaptivity);
  const personalizedTitle = getPersonalizedTitle(node.label, zone, isEmotionalCaptivity);

  const understandingSubtext = isEmotionalCaptivity
    ? "أنت نجحت تبعد بجسمك، بس لسه محتاج تبعد بأفكارك ومشاعرك (فك الارتباط الشعوري)."
    : undefined;

  const situationsCount = node.firstStepProgress?.stepInputs
    ? Object.values(node.firstStepProgress.stepInputs).flat().filter((s) => s?.trim()).length
    : 0;
  const canShowRecoveryPlan = situationsCount >= 2;
  const canShowPlanPreview = true;

  return {
    diagnosis: {
      zone,
      stateLabel,
      recommendedLabel: analysis.recommendedRing ? recommendedLabels[analysis.recommendedRing] : null,
      hasMismatch: !!(analysis.recommendedRing && node.ring !== analysis.recommendedRing),
      goalAction,
      personalizedTitle,
      understanding,
      isEmotionalCaptivity,
      understandingSubtext,
      enemyExplanation: isEmotionalCaptivity ? STATIC_ENEMY_EXPLANATION(node.label) : undefined,
      showDetachmentSections: isEmotionalCaptivity,
      diagnosisSummary: insights?.diagnosisSummary
    },
    symptoms: {
      ring: node.ring,
      personLabel: node.label,
      selectedSymptoms: analysis.selectedSymptoms ?? [],
      symptomsInterpretation: insights?.symptomsInterpretation
    },
    solution: {
      currentRing: node.ring,
      personLabel: node.label,
      category,
      selectedSymptoms: analysis.selectedSymptoms,
      solutionSuggestions: insights?.solutionSuggestions
    },
    plan: {
      personLabel: node.label,
      hasAnalysis: !!node.analysis,
      hasSelectedSymptoms: !!(node.analysis?.selectedSymptoms && node.analysis.selectedSymptoms.length > 0),
      hasWrittenSituations: situationsCount >= 2,
      situationsCount,
      hasCompletedTraining: node.hasCompletedTraining ?? false,
      completedRecoverySteps: node.recoveryProgress?.completedSteps?.length ?? 0,
      totalRecoverySteps: 10,
      journeyStartDate: node.journeyStartDate,
      canShowRecoveryPlan,
      canShowPlanPreview,
      planHighlights: insights?.planHighlights
    }
  };
}
