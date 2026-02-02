export type Ring = "green" | "yellow" | "red";

/** غالبًا / أحيانًا / نادراً — نفس أسلوب RealityCheck و FeelingCheck */
export type HealthAnswers = {
  q1: "often" | "sometimes" | "rarely";
  q2: "often" | "sometimes" | "rarely";
  q3: "often" | "sometimes" | "rarely";
};

/** اختياري: تغذية من AI — لو وُجدت تُدمج في واجهة التبويبات من غير تغيير المعمار */
export interface PersonViewInsights {
  /** تشخيص: نص إضافي أو بديل عن "فهم الوضع" (مثلاً من AI) */
  diagnosisSummary?: string;
  /** أعراض: تفسير أو تلخيص للأعراض المختارة (مثلاً من AI) */
  symptomsInterpretation?: string;
  /** حل: اقتراحات إضافية أو نص مخصص لتبويب الحل (مثلاً من AI) */
  solutionSuggestions?: string;
  /** خطة: نقاط بارزة أو ملخص لخطة التعافي (مثلاً من AI) */
  planHighlights?: string[];
}

export interface AnalysisResult {
  score: number;
  answers: HealthAnswers;
  timestamp: number;
  recommendedRing: Ring;
  selectedSymptoms?: string[]; // IDs of symptoms user confirmed
  /** تغذية اختيارية من AI للتبويبات الأربعة — التطبيق يدمجها دون تغيير هيكل الواجهة */
  insights?: PersonViewInsights;
}

export interface PersonNote {
  id: string;
  text: string;
  comment?: string;
  timestamp: number;
}

export interface SituationLog {
  id: string;
  date: number;
  situation: string;
  feeling: string;
  response: string;
  outcome: string;
  lesson: string;
}

export interface FirstStepProgress {
  completedFirstSteps: string[]; // IDs of completed first steps (e.g., "red-0", "red-1", "red-2")
  stepInputs: Record<string, string[]>; // Store inputs for steps that require text (e.g., {"red-0": ["موقف 1", "موقف 2", "موقف 3"]})
}

export interface RecoveryProgress {
  completedSteps: string[]; // IDs of completed steps
  situationLogs: SituationLog[];
  dynamicStepInputs?: Record<string, string>; // Store dynamic step inputs
  /** تعليق المستخدم على صعوبة تمرين: قاسي | سهل | مش واقعي */
  stepFeedback?: Record<string, "hard" | "easy" | "unrealistic">;
}

export interface MapNode {
  id: string;
  label: string;
  ring: Ring;
  x: number;
  y: number;
  analysis?: AnalysisResult;
  notes?: PersonNote[];
  recoveryProgress?: RecoveryProgress;
  firstStepProgress?: FirstStepProgress;
  dynamicPlanGenerated?: boolean; // Flag to check if dynamic plan was generated
  patternsAnalyzed?: boolean; // Flag to check if patterns were analyzed
  lastViewedStep?: "result" | "firstStep" | "recoveryPlan"; // Track last viewed step for "complete later" feature
  journeyStartDate?: number; // Timestamp when user started the recovery journey
  hasCompletedTraining?: boolean; // Flag to track if user completed personalized training
}

