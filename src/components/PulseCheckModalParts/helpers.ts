import type { PulseMood, PulseFocus } from "../../state/pulseState";

/**
 * Energy gradient background mapper
 */
export function energyGradient(energy: number | null): string {
  if (energy == null || energy <= 0) return "radial-gradient(ellipse at 50% 60%, rgba(148, 163, 184, 0.1) 0%, transparent 60%)";
  if (energy <= 2) return "radial-gradient(ellipse at 50% 60%, rgba(248, 113, 113, 0.12) 0%, transparent 60%)";
  if (energy <= 4) return "radial-gradient(ellipse at 50% 60%, rgba(251, 191, 36, 0.1) 0%, transparent 60%)";
  if (energy <= 6) return "radial-gradient(ellipse at 50% 60%, rgba(45, 212, 191, 0.08) 0%, transparent 55%)";
  if (energy <= 8) return "radial-gradient(ellipse at 50% 60%, rgba(45, 212, 191, 0.12) 0%, transparent 55%)";
  return "radial-gradient(ellipse at 50% 60%, rgba(45, 212, 191, 0.18) 0%, rgba(139, 92, 246, 0.06) 40%, transparent 65%)";
}

/**
 * Human-readable energy state label
 */
export function getEnergyStateLabel(energy: number | null): string {
  if (energy == null) return "غير محددة";
  if (energy <= 2) return "منخفضة جدًا";
  if (energy <= 4) return "منخفضة";
  if (energy <= 6) return "متوسطة";
  if (energy <= 8) return "مرتفعة";
  return "مرتفعة جدًا";
}

/**
 * Short hint text based on energy
 */
export function getEnergyQuickHint(energy: number | null): string {
  if (energy == null) return "اختر الدرجة";
  if (energy <= 2) return "باحتاج هدوء";
  if (energy <= 4) return "هادي بشوية";
  if (energy <= 6) return "متوازن";
  if (energy <= 8) return "جاهز";
  return "طاقة عالية";
}

/**
 * Short hint text based on mood
 */
export function getMoodQuickHint(mood: PulseMood | null): string {
  if (!mood) return "اختر وصفًا قريبًا من حالتك";
  switch (mood) {
    case "bright":
      return "استغل الصفاء بخطوة مباشرة.";
    case "calm":
      return "ممتاز، احافظ على النسق الهادئ.";
    case "tense":
      return "نفس قصير يقلل التوتر قبل الخطوة.";
    case "hopeful":
      return "خلّ الحماس يتحول لتنفيذ فعلي.";
    case "anxious":
      return "ابدأ بخطوة موضحة وواحدة فقط.";
    case "angry":
      return "حوّل الاندفاع لقرار محسوب.";
    case "sad":
      return "اسمح بخطوة صغيرة مرنة.";
    case "overwhelmed":
      return "بسّط المشهد: خيار واحد الآن.";
    default:
      return "اختر وصفًا قريبًا من حالتك";
  }
}

/**
 * Short hint text based on focus
 */
export function getFocusQuickHint(focus: PulseFocus | null, isStartRecovery: boolean): string {
  if (!focus) return "حدّد على إيه عايز تركّز دلوقتي";
  if (focus === "event") return "ركّز على الموقف اللي حصل — فكّك بتفاصيله.";
  if (focus === "thought") return "لاحظ الفكرة المتكررة — ده أول خطوة لكسرها.";
  if (focus === "body") return "اسمع جسمك — خطوة هادية تفرق معاك.";
  return isStartRecovery
    ? "ابدأ من هنا — استكشف احتياجاتك بهدوء."
    : "كمّل من حيث وقفت — نفّذ خطوتك الجاية.";
}

export type TacticalAdvice = {
  title: string;
  message: string;
  action: string;
  theme: "attack" | "defend" | "recover";
  icon: string;
};

/**
 * Generates tactical advice based on pulse check inputs
 */
export function generateTacticalAdvice(energy: number, mood: PulseMood | null, focus: PulseFocus | null): TacticalAdvice {
  // 1. Body focus
  if (focus === "body") {
    if (energy <= 4) {
      return {
        title: "بروتوكول أوميحا-3: إعادة شحن",
        message: "حساسات الجسد تشير إلى استنفاد حاد. أي ضغط إضافي سيؤدي إلى انهيار تكتيكي في الإنتاجية.",
        action: "توقف فوري. دقيقتين تنفس مربع (Box Breathing) قبل أي قرار.",
        theme: "recover",
        icon: "🔋"
      };
    }
    return {
      title: "بروتوكول سيجما: صيانة حيوية",
      message: "حالة الجسد مستقرة، لكنها تحتاج إلى معايرة دورية للحفاظ على كفاءة المحرك الذهني.",
      action: "شرب كوب ماء + تمدد (Stretch) لمدة 60 ثانية الآن.",
      theme: "recover",
      icon: "💆"
    };
  }

  // 2. Event focus
  if (focus === "event") {
    if (energy <= 4) {
      return {
        title: "بروتوكول دلتا: درع الحماية",
        message: "الموقف الخارجي استهلك احتياطي الطاقة. الانسحاب التكتيكي ضروري لإعادة التمركز.",
        action: "عزل الموقف. اكتبه في جملة واحدة تقنية (بدون مشاعر) وضعه جانباً.",
        theme: "defend",
        icon: "🛡️"
      };
    }
    return {
      title: "بروتوكول ألفا: اشتباك مباشر",
      message: "مستوى الطاقة يسمح بالتعامل مع الموقف. التركيز هو مفتاح الحسم.",
      action: "حدد ثغرة واحدة في الموقف يمكنك استغلالها فوراً.",
      theme: "attack",
      icon: "🎯"
    };
  }

  // 3. Thought focus
  if (focus === "thought") {
    return {
      title: "بروتوكول زيتا: تحليل العمق",
      message: "الفكرة المتكررة هي مجرد ضجيج في الرادار. نحتاج إلى تصفية الإشارة.",
      action: "اسأل: هل هذه الفكرة مبنية على بيانات حقيقية أم افتراضات دفاعية؟",
      theme: "defend",
      icon: "🔍"
    };
  }

  // 4. High energy — no specific focus
  if (energy >= 7) {
    return {
      title: "بروتوكول جاما: انطلاق كوني",
      message: "الأنظمة في حالة استعداد قصوى. هذه هي نافذة الإطلاق المثالية.",
      action: "الهجوم على أصعب مهمة في القائمة الآن بدون تردد.",
      theme: "attack",
      icon: "🚀"
    };
  }

  return {
    title: "بروتوكول بيتا: ثبات المسار",
    message: "أنت في حالة توازن تكتيكي. الاستمرارية هي القوة الحقيقية هنا.",
    action: "التنفيذ الهادئ لمهمة واحدة متوسطة الأهمية.",
    theme: "defend",
    icon: "📍"
  };
}

/**
 * Gets a short message for post-save analytics
 */
export function getPostSaveAction(energy: number): string {
  if (energy <= 3) return "تم تفعيل بروتوكول الصيانة";
  if (energy <= 6) return "تم تحديث إحداثيات الإشتباك";
  return "الأنظمة في حالة استعداد قصوى";
}
