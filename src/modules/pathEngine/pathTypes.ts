/**
 * محرك المسارات الديناميكي (Dynamic Pathway Engine)
 * هيكل الداتا لدعم مسارات تعافي مخصصة حسب التشخيص.
 */

/** معرف المسار — 5 مسارات رئيسية (فلسفة: كل التعافي حدود) */
export type PathId =
  | "path_protection"   // درع الحماية = حدود خارجية (أحمر + احتكاك عالي)
  | "path_detox"        // الصيام الشعوري = حدود داخلية (رمادي / أحمر + احتكاك منخفض)
  | "path_negotiation"  // فن المسافة (أصفر)
  | "path_deepening"   // الجذور العميقة (أخضر)
  | "path_sos";        // الطوارئ القصوى

/** نوع الألم / العرض السائد */
export type SymptomType = "guilt" | "fear" | "drain" | "anger" | "mixed";

/** معدل الاحتكاك */
export type ContactLevel = "high" | "medium" | "low" | "none";

/** مرحلة المسار */
export type PathStage = "awareness" | "resistance" | "acceptance" | "integration";

/** مهمة ديناميكية (يومية أو أسبوعية) — قد يولّدها الـ AI */
export interface DynamicTask {
  id: string;
  type: "reflection" | "writing" | "practice" | "observation" | "challenge" | "breathing";
  title: string;
  text: string;
  helpText?: string;
  requiresInput?: boolean;
  placeholder?: string;
  /** صعوبة مقترحة (1–5) — الـ AI قد يعدّلها حسب التقدّم */
  difficultyHint?: number;
}

/** مرحلة أسبوعية في المسار */
export interface PathPhase {
  week: number;
  focus: string;
  description: string;
  tasks: DynamicTask[];
  successCriteria?: string;
}

/** مسار تعافي كامل — قد يُولَّد من Gemini */
export interface RecoveryPath {
  id: PathId;
  name: string;
  nameAr: string;
  description: string;
  phases: {
    week1: PathPhase;
    week2: PathPhase;
    week3: PathPhase;
  };
  /** للسماح للـ AI بتعديل الصعوبة لاحقاً */
  aiAdjustmentFactor?: number;
}

/** تقدّم يومي — لتغذية لوحة القياس */
export interface DailyProgress {
  date: string; // YYYY-MM-DD
  didComplete: boolean;
  moodScore?: number; // 1–5
  taskId?: string;
  note?: string;
}

/** سياق المستخدم في المسار — يُخزَّن مع العقدة أو في الـ state */
export interface UserPathContext {
  currentPathId: PathId;
  stage: PathStage;
  dailyProgress: DailyProgress[];
  aiAdjustmentFactor: number;
  /** لقطة من المسار المُولَّد (من Gemini) — للعرض يوم بيوم */
  recoveryPathSnapshot?: RecoveryPath;
  /** آخر تاريخ تم فيه تحديث المسار من الـ AI (recalculating) */
  lastPathGeneratedAt?: number;
}
