import type { Ring } from "../modules/map/mapTypes";

/**
 * Recovery Roadmap System
 * خريطة واضحة للرحلة من الاستنزاف للتعافي
 */

export interface RoadmapPhase {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
  duration: string; // تقديري
  goals: string[];
  successIndicators: string[];
  challenges: string[];
  tips: string[];
}

export interface RoadmapProgress {
  currentPhase: string;
  completedPhases: string[];
  isComplete: boolean;
}

/**
 * المراحل الست للتعافي
 */
export const RECOVERY_PHASES: RoadmapPhase[] = [
  // المرحلة 1: الوعي
  {
    id: "awareness",
    title: "الوعي والاكتشاف",
    shortTitle: "الوعي",
    description: "أنت اكتشفت إن فيه مشكلة في العلاقة. دي أهم خطوة - الوعي أول طريق التعافي.",
    icon: "👁️",
    duration: "أنت هنا دلوقتي",
    goals: [
      "فهم الواقع الحقيقي للعلاقة",
      "التعرف على الأعراض اللي بتحس بيها",
      "قبول إن فيه مشكلة محتاجة حل"
    ],
    successIndicators: [
      "✓ عملت Reality Check + Feeling Check",
      "✓ عرفت المكان الحالي للعلاقة",
      "✓ حددت الأعراض اللي بتعاني منها",
      "✓ فهمت التأثير السلبي عليك"
    ],
    challenges: [
      "الإنكار: 'مش ممكن يكون في مشكلة'",
      "التبرير: 'بس هو/هي مش قاصد'",
      "الخوف من المواجهة"
    ],
    tips: [
      "اسمع لجسمك - هو مش بيكذب",
      "الوعي مش خيانة - ده حماية لنفسك",
      "مش مطلوب منك تعمل أي حاجة دلوقتي - بس اعترف بالحقيقة"
    ]
  },

  // المرحلة 2: التعلم
  {
    id: "learning",
    title: "التعلم والتدريب",
    shortTitle: "التدريب",
    description: "دلوقتي بتتعلم إزاي تحمي نفسك. بتتدرب على الحدود في بيئة آمنة قبل ما تطبقها في الواقع.",
    icon: "📚",
    duration: "أسبوع 1-2",
    goals: [
      "تعلم إزاي تحط حدود صحية",
      "التدرب على قول 'لأ' بدون ذنب",
      "فهم الفرق بين الحب والاستنزاف",
      "التعرف على أنماط التلاعب"
    ],
    successIndicators: [
      "✓ خلصت السيناريوهات التدريبية",
      "✓ عرفت إزاي ترد على المواقف الصعبة",
      "✓ فهمت الحدود الصحية",
      "✓ كتبت 2+ مواقف للتحليل"
    ],
    challenges: [
      "الشعور بالذنب: 'أنا أناني'",
      "الخوف من رد الفعل",
      "الشك في النفس: 'هل أنا صح؟'"
    ],
    tips: [
      "التدريب في بيئة آمنة بيبني الثقة",
      "كل خطوة صغيرة = تقدم حقيقي",
      "مش مطلوب إنك تكون مثالي - المهم البداية"
    ]
  },

  // المرحلة 3: التطبيق الأولي
  {
    id: "initial-practice",
    title: "التطبيق الأولي في الواقع",
    shortTitle: "التطبيق",
    description: "الوقت جه - بتبدأ تطبق الحدود الصغيرة في الواقع. دي أصعب مرحلة بس أهمها.",
    icon: "🎯",
    duration: "أسبوع 2-3",
    goals: [
      "تطبيق حد واحد صغير",
      "قول 'لأ' مرة واحدة على الأقل",
      "تحديد وقت للتواصل",
      "الانسحاب من موقف مستنزف مرة واحدة"
    ],
    successIndicators: [
      "✓ طبقت حد واحد على الأقل",
      "✓ قلت 'لأ' بدون تبرير مبالغ",
      "✓ حددت وقت للمكالمة والتزمت بيه",
      "✓ انسحبت من موقف استنزاف"
    ],
    challenges: [
      "رد الفعل السلبي من الشخص",
      "الشعور بالذنب الشديد",
      "الرغبة في التراجع",
      "الشك: 'هل أنا بالغت؟'"
    ],
    tips: [
      "رد الفعل السلبي = دليل إنك على الطريق الصح",
      "الذنب هيقل مع الوقت - استمر",
      "لو رجعت خطوة، ده عادي - المهم تكمل",
      "احتفل بكل انتصار صغير"
    ]
  },

  // المرحلة 4: التوسع والتعميق
  {
    id: "expansion",
    title: "التوسع وتعميق الحدود",
    shortTitle: "التوسع",
    description: "الحدود الأولى نجحت! دلوقتي بتوسعها وبتعمقها - بتاخد مساحة أكبر ليك.",
    icon: "🌱",
    duration: "أسبوع 3-4",
    goals: [
      "تطبيق حدود أكبر وأوضح",
      "رفض أكتر من طلب في نفس الأسبوع",
      "تحديد مواضيع 'محظورة'",
      "تقليل وقت التواصل"
    ],
    successIndicators: [
      "✓ طبقت 3+ حدود في نفس الأسبوع",
      "✓ رفضت طلبات متعددة",
      "✓ حددت مواضيع مش هتتناقش فيها",
      "✓ قللت وقت التواصل 50%"
    ],
    challenges: [
      "محاولات أقوى لكسر الحدود",
      "جمل التلاعب: 'أنت اتغيرت'",
      "الضغط من العائلة/المجتمع",
      "الإرهاق من المقاومة المستمرة"
    ],
    tips: [
      "المقاومة = دليل التقدم",
      "خليك حازم - التنازل بيرجعك للبداية",
      "استعين بصديق يدعمك",
      "راجع خطة التعافي لما تحس بضعف"
    ]
  },

  // المرحلة 5: الاستقرار
  {
    id: "stabilization",
    title: "الاستقرار والحماية المستدامة",
    shortTitle: "الاستقرار",
    description: "الحدود بقت جزء من حياتك. العلاقة في مكانها الصحيح دلوقتي - بتحافظ على الاستقرار ده.",
    icon: "🛡️",
    duration: "شهر 2-3",
    goals: [
      "الحفاظ على الحدود بدون مجهود كبير",
      "التعامل مع المحاولات الجديدة بثقة",
      "استرجاع الطاقة والصحة النفسية",
      "بناء حياة مستقلة عن العلاقة"
    ],
    successIndicators: [
      "✓ الحدود بقت تلقائية",
      "✓ الذنب قل بنسبة 80%+",
      "✓ الأعراض الجسدية اختفت/قلت كتير",
      "✓ رجعت لاهتماماتك وهواياتك"
    ],
    challenges: [
      "الملل من 'الحرب' المستمرة",
      "إغراء التنازل 'مرة واحدة بس'",
      "الشعور بالوحدة أحياناً",
      "الخوف من فقدان العلاقة تماماً"
    ],
    tips: [
      "الاستقرار ده نتيجة مجهودك - احتفل بيه",
      "لو حسيت بوحدة، ابني علاقات صحية جديدة",
      "متنازلش - أي تنازل بيكسر كل اللي بنيته",
      "الحدود = حب لنفسك، مش قسوة على غيرك"
    ]
  },

  // المرحلة 6: التعافي والازدهار
  {
    id: "recovery",
    title: "التعافي الكامل والازدهار",
    shortTitle: "التعافي",
    description: "أنت وصلت! العلاقة في مكانها الصحيح، وأنت متعافي نفسياً. دلوقتي بتحافظ وبتزدهر.",
    icon: "🌟",
    duration: "شهر 3+",
    goals: [
      "الحفاظ على التعافي",
      "مساعدة الآخرين من خبرتك",
      "الازدهار في حياتك الشخصية",
      "تطوير علاقات صحية جديدة"
    ],
    successIndicators: [
      "✓ العلاقة مستقرة في مكانها الصحيح",
      "✓ صفر أعراض استنزاف",
      "✓ صحتك النفسية ممتازة",
      "✓ عندك طاقة للحياة والنمو"
    ],
    challenges: [
      "الخوف من الانتكاسة",
      "الرغبة في 'إصلاح' الشخص",
      "نسيان الماضي المؤلم",
      "التساهل في الحدود"
    ],
    tips: [
      "افتكر من فين جيت - متنساش الألم",
      "الشخص مسؤول عن نفسه - مش دورك تصلحه",
      "راجع خطة التعافي كل 3 شهور",
      "ساعد اللي لسه في البداية - خبرتك كنز"
    ]
  }
];

/**
 * تحديد المرحلة الحالية بناءً على التقدم
 */
export function calculateCurrentPhase(
  hasAnalysis: boolean,
  hasSelectedSymptoms: boolean,
  hasWrittenSituations: boolean,
  hasCompletedTraining: boolean,
  completedRecoverySteps: number,
  totalRecoverySteps: number,
  daysSinceStart: number
): string {
  // المرحلة 1: الوعي (دايماً أول مرحلة)
  if (!hasSelectedSymptoms) {
    return "awareness";
  }

  // المرحلة 2: التعلم (بدأ يتعلم ويتدرب)
  if (!hasWrittenSituations || !hasCompletedTraining) {
    return "learning";
  }

  // المرحلة 3: التطبيق الأولي (كتب مواقف وبدأ الخطة)
  if (completedRecoverySteps < totalRecoverySteps * 0.3) {
    return "initial-practice";
  }

  // المرحلة 4: التوسع (خلص 30-70% من الخطة)
  if (completedRecoverySteps < totalRecoverySteps * 0.7) {
    return "expansion";
  }

  // المرحلة 5: الاستقرار (خلص 70%+ بس لسه مبدري)
  if (daysSinceStart < 60) {
    return "stabilization";
  }

  // المرحلة 6: التعافي (خلص الخطة + عدى 60+ يوم)
  return "recovery";
}

/**
 * حساب نسبة التقدم الإجمالية
 */
export function calculateOverallProgress(currentPhaseId: string): number {
  const phaseIndex = RECOVERY_PHASES.findIndex(p => p.id === currentPhaseId);
  if (phaseIndex === -1) return 0;
  
  return Math.round(((phaseIndex + 1) / RECOVERY_PHASES.length) * 100);
}

/**
 * الحصول على المرحلة القادمة
 */
export function getNextPhase(currentPhaseId: string): RoadmapPhase | null {
  const currentIndex = RECOVERY_PHASES.findIndex(p => p.id === currentPhaseId);
  if (currentIndex === -1 || currentIndex === RECOVERY_PHASES.length - 1) {
    return null;
  }
  return RECOVERY_PHASES[currentIndex + 1];
}

/**
 * الحصول على المراحل المكتملة
 */
export function getCompletedPhases(currentPhaseId: string): string[] {
  const currentIndex = RECOVERY_PHASES.findIndex(p => p.id === currentPhaseId);
  if (currentIndex === -1) return [];
  
  return RECOVERY_PHASES.slice(0, currentIndex).map(p => p.id);
}

/**
 * التحقق من اكتمال الرحلة
 */
export function isJourneyComplete(currentPhaseId: string): boolean {
  return currentPhaseId === "recovery";
}
