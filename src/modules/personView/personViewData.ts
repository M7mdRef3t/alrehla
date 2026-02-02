/**
 * عقد بيانات نافذة الشخص — التبويبات الأربعة (تشخيص، أعراض، حل، خطة) تتغذى من هنا.
 * مصدر البيانات: node + قاعدة ثابتة. عند إضافة AI نملأ insights في analysis والدمج يحدث هنا من غير تغيير المعمار.
 */
import type { MapNode, Ring } from "../map/mapTypes";
import type { AdviceCategory } from "../../data/adviceScripts";
import { getGoalAction } from "../../copy/goalPicker";

export type ResultTabId = "diagnosis" | "symptoms" | "solution" | "plan";

/** بيانات تبويب التشخيص */
export interface DiagnosisPayload {
  zone: Ring;
  stateLabel: string;
  recommendedLabel: string | null;
  hasMismatch: boolean;
  goalAction: string;
  personalizedTitle: string;
  /** من القاعدة الثابتة — لو وُجد insights.diagnosisSummary يُعرض إضافياً أو بديلاً حسب الواجهة */
  understanding: string;
  /** اختياري من AI */
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

const stateLabels: Record<Ring, string> = {
  green: "صحية",
  yellow: "محتاجة انتباه",
  red: "استنزاف"
};

const recommendedLabels: Record<Ring, string> = {
  green: "قرب صحي",
  yellow: "محتاجة انتباه",
  red: "استنزاف"
};

function getUnderstanding(personLabel: string, zone: Ring): string {
  const texts: Record<Ring, string> = {
    red: `علاقتك مع ${personLabel} بتاخد منك أكتر مما بتديك. جسمك بيحذرك - اسمع له.`,
    yellow: `في أنماط مش صحية في علاقتك مع ${personLabel} محتاجة انتباه. الحدود هتحميك.`,
    green: `علاقتك مع ${personLabel} صحية ومتوازنة. حافظ عليها واستمر.`
  };
  return texts[zone];
}

function getPersonalizedTitle(personLabel: string, zone: Ring): string {
  const titles: Record<Ring, string> = {
    red: `قربك من "${personLabel}" مؤلم ومحتاج حماية`,
    yellow: `علاقتك مع "${personLabel}" محتاجة ضبط`,
    green: `علاقتك مع "${personLabel}" صحية وآمنة`
  };
  return titles[zone];
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

  const situationsCount = node.firstStepProgress?.stepInputs
    ? Object.values(node.firstStepProgress.stepInputs).flat().filter((s) => s?.trim()).length
    : 0;
  const canShowRecoveryPlan = situationsCount >= 2;
  const canShowPlanPreview = true;

  return {
    diagnosis: {
      zone,
      stateLabel: stateLabels[zone],
      recommendedLabel: analysis.recommendedRing ? recommendedLabels[analysis.recommendedRing] : null,
      hasMismatch: !!(analysis.recommendedRing && node.ring !== analysis.recommendedRing),
      goalAction: getGoalAction(goalId),
      personalizedTitle: getPersonalizedTitle(node.label, zone),
      understanding: getUnderstanding(node.label, zone),
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
