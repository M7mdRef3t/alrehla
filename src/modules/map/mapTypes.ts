export type Ring = "green" | "yellow" | "red";
export type MapType = "classic" | "masafaty";

// Import types from Masarat SDK via the Path Engine bridge
import type { 
  DetectedPattern, 
  DynamicRecoveryPlan, 
  PatternType,
  SymptomType 
} from "@/modules/pathEngine/pathTypes";

/** إجابات شاشة "فين الشخص في حياتك" — للاستنزاف عن بُعد وتخزينها على العقدة */
export type RealityOption = "often" | "sometimes" | "rarely" | "never";
export interface RealityAnswers {
  q1: RealityOption;
  q2: RealityOption;
  q3: RealityOption;
}

/** صيغة قياسية: دايماً/جداً، أحياناً، نادراً، أبداً/لأ — نفس أسلوب FeelingCheck */
export type HealthAnswers = {
  q1: "often" | "sometimes" | "rarely" | "never";
  q2: "often" | "sometimes" | "rarely" | "never";
  q3: "often" | "sometimes" | "rarely" | "never";
};

/** اختياري: تغذية من AI — لو وُجدت تُدمج في واجهة التبويبات من غير تغيير المعمار */
export interface PersonViewInsights {
  /** تشخيص: نص إضافي أو بديل عن "فهم الوضع" (مثلاً من AI) */
  diagnosisSummary?: string;
  /** عنوان مخصص لتبويب التشخيص (لو AI حب يغيّره) */
  diagnosisTitle?: string;
  /** نص مخصص لـ "فهم الوضع" */
  diagnosisUnderstanding?: string;
  /** تسمية حالة مخصصة (تظهر تحت العنوان) */
  stateLabel?: string;
  /** هدف مخصص للعمل (صياغة أوضح للهدف) */
  goalAction?: string;
  /** فقرة إضافية تحت فهم الوضع (مثلاً لاستنزاف عن بُعد) */
  understandingSubtext?: string;
  /** توضيح الحالة — العدو جوه الدماغ مثلاً */
  enemyExplanation?: string;
  /** أعراض: تفسير أو تلخيص للأعراض المختارة (مثلاً من AI) */
  symptomsInterpretation?: string;
  /** حل: اقتراحات إضافية أو نص مخصص لتبويب الحل (مثلاً من AI) */
  solutionSuggestions?: string;
  /** خطة: نقاط بارزة أو ملخص لخطة التعافي (مثلاً من AI) */
  planHighlights?: string[];
  /** المخطط اللاشعوري المكتشف (من consciousnessService) */
  underlyingPattern?: string;
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

/** تقدّم يومي — لمحرك المسارات (لوحة القياس) */
export interface DailyPathProgress {
  date: string;
  didComplete: boolean;
  moodScore?: number;
  taskId?: string;
  note?: string;
}

export interface RecoveryProgress {
  completedSteps: string[];
  situationLogs: SituationLog[];
  dynamicStepInputs?: Record<string, string>;
  stepFeedback?: Record<string, "hard" | "easy" | "unrealistic">;
  /** مسار فك الارتباط: مرساة الواقع (3 أسباب) */
  detachmentReasons?: string[];
  ruminationLogCount?: number;
  /** محرك المسارات: مسار التعافي الحالي (path_protection | path_detox | …) */
  pathId?: string;
  /** مرحلة المسار: awareness | resistance | acceptance | integration */
  pathStage?: string;
  /** تقدّم يومي — لتغذية لوحة القياس */
  dailyPathProgress?: DailyPathProgress[];
  /** عامل تعديل الصعوبة من الـ AI (1 = عادي) */
  aiAdjustmentFactor?: number;
  /** لقطة المسار المُولَّدة من Gemini — للعرض يوم بيوم (يُخزَّن كـ JSON) */
  recoveryPathSnapshot?: unknown;
  /** آخر تاريخ تم فيه تحديث المسار من الـ AI (إعادة تحضير) */
  lastPathGeneratedAt?: number;
  /** مؤشر شرعية الحدود (0–100) — لمسار الصيام الشعوري: مدى تصالح المستخدم مع وضع الحد */
  boundaryLegitimacyScore?: number;
  /** الخطة الديناميكية المولّدة من المحرك السيادي */
  dynamicPlan?: DynamicRecoveryPlan;
  /** الأنماط المرصودة في هذه العلاقة */
  detectedPatterns?: DetectedPattern[];
  /** نوع العرض السائد المكتشف */
  symptomType?: SymptomType;
  /** النمط الرئيسي المستهدف في الخطة */
  primaryPattern?: PatternType;
}

export type QuickAnswerValue = "high" | "medium" | "low" | "zero";

export interface MissionProgress {
  startedAt?: number;
  completedAt?: number;
  isCompleted?: boolean;
  checkedSteps?: number[];
  isArchived?: boolean;
  archivedAt?: number;
}

/** بيانات الشجرة: مين فوقه (parent) ونوع العلاقة — للعيلة/شغل/اجتماعي */
export type TreeRelationType = "family" | "work" | "social";

export interface TreeRelation {
  type: TreeRelationType;
  parentId: string | null;
  relationLabel: string;
}

export interface EnergyTransaction {
  id: string;
  amount: number; // Positive for charge, Negative for drain
  timestamp: number;
  note?: string;
}

export interface EnergyBalance {
  totalCharge: number;
  totalDrain: number;
  netEnergy: number;
  transactions: EnergyTransaction[];
}

export type FeelingCheckAsset = "body" | "time" | "energy" | "money" | "space";
export type FeelingCheckResult = Record<FeelingCheckAsset, number>; // 0-100

export type OrbitHistoryEventType = "created" | "ring_changed" | "archived" | "restored";

export interface OrbitHistoryEntry {
  id: string;
  type: OrbitHistoryEventType;
  timestamp: number;
  ring: Ring;
  fromRing?: Ring;
}

export interface MapNode {
  id: string;
  label: string;
  ring: Ring;
  /** اختياري: رابط صورة الشخص — يظهر كأفاتار في الدائرة */
  avatarUrl?: string;
  x: number;
  y: number;
  analysis?: AnalysisResult;
  notes?: PersonNote[];
  recoveryProgress?: RecoveryProgress;
  firstStepProgress?: FirstStepProgress;
  dynamicPlanGenerated?: boolean; 
  patternsAnalyzed?: boolean; 
  /** التشخيص السيادي: لقطة من المحرك اللحظي */
  sovereignDiagnostic?: {
    pathId: string;
    symptomType: SymptomType;
    confidence: number;
    timestamp: number;
  };
  lastViewedStep?: "result" | "firstStep" | "recoveryPlan"; 
  journeyStartDate?: number; // Timestamp when user started the recovery journey
  hasCompletedTraining?: boolean; // Flag to track if user completed personalized training
  /** اختياري: ربط في الشجرة — لو موجود يُستخدم في عرض شجرة العيلة/الشغل */
  treeRelation?: TreeRelation;
  /** اختياري: سياق الإضافة — عيلة/شغل/حب/فلوس؛ للفلتر وعرض الكل */
  goalId?: string;
  /** جسدياً بعيد، شعورياً عالق — خطة فك الارتباط بدل الحدود */
  detachmentMode?: boolean;
  /** إجابات "فين الشخص في حياتك" — لعرض نفس محتوى النتيجة عند فتح النافذة */
  realityAnswers?: RealityAnswers;
  /** إجابة سؤال الأمان السريع — لتحديد السيناريو عند إعادة فتح النتيجة */
  safetyAnswer?: QuickAnswerValue;
  /** حالة طوارئ من الأسئلة السريعة */
  isEmergency?: boolean;
  /** تقدّم المهمة (التنفيذ) */
  missionProgress?: MissionProgress;
  /** في المنطقة الرمادية (تعافي) — الدائرة خارج الخريطة الملونة، لون باهت */
  isDetached?: boolean;
  /** أرشفة الشخص بدل الحذف النهائي — بيختفي من الخريطة بس بيفضل محفوظ */
  isNodeArchived?: boolean;
  archivedAt?: number;

  /** كشف حساب الطاقة (Energy P&L) - تتبع الاستنزاف أو الشحن من هذه العلاقة */
  energyBalance?: EnergyBalance;

  /** بطارية طوارئ بشرية: شخص آمن يمكن اللجوء إليه عند نفاذ الطاقة */
  isPowerBank?: boolean;

  /** البصمة الخفية: وقت آخر تغيير للمدار أو الأرشفة، يُستخدم لحساب غرامة الركود */
  lastRingChangeAt?: number;
  orbitHistory?: OrbitHistoryEntry[];
  /** جاري التحليل بواسطة الـ AI (Optimistic UI) */
  isAnalyzing?: boolean;

  /** نتيجة آخر اختبار — تُحفظ بعد إكمال أي اختبار وتظهر كشارة على بطاقة الشخص */
  quizResult?: {
    bandTitle: string;
    bandColor: string;
    score: number;
    maxScore: number;
    timestamp: number;
    quizId: string;
  };
  /** النقطة الأولى المختارة من الـ 10-Second Mirror (تستخدم لإضافة Aura بصري مخصص) */
  isMirrorNode?: boolean;
  isPinned?: boolean;

  /** ⚔️ ميزان الحقيقة: تتبع العطاء والأخذ الفعلي في العلاقة */
  reciprocity?: {
    givenCount: number;      // عدد مرات العطاء
    receivedCount: number;   // عدد مرات الأخذ
    lastGivenAt?: number;    // تاريخ آخر عطاء
    lastReceivedAt?: number; // تاريخ آخر أخذ
    brokenPromises: number;  // وعود مكسورة
    cancelledMeets: number;  // لقاءات ملغية
  };

  /** رنين الجلسة الحية: آخر مرة تم فيها عمل Mirror لهذا الشخص */
  lastLiveSessionAt?: number;
  /** لقطة من آخر عقد حقيقة تم توقيعه في الجلسة الحية */
  lastTruthContract?: {
    summary: string;
    score: number;
    actionPoints?: string[];
    reminder?: string;
    timestamp: number;
  };
}
