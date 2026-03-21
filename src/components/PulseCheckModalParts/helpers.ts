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
        title: "إعادة شحن",
        message: "جسمك بيقولك إنه محتاج يرتاح. الاستمرار من غير راحة هيزوّد الإرهاق.",
        action: "خُد دقيقتين تنفّس عميق وبعدين قرّر خطوتك.",
        theme: "recover",
        icon: "🔋"
      };
    }
    return {
      title: "عناية بالجسد",
      message: "جسمك كويس — بس محتاج عناية بسيطة تحافظ على أداءك.",
      action: "تمرين سريع أو اشرب مية.",
      theme: "recover",
      icon: "💆"
    };
  }

  // 2. Event focus
  if (focus === "event") {
    if (energy <= 4) {
      return {
        title: "حماية الطاقة",
        message: "الموقف ده استنزف كتير من طاقتك. محتاج تحمي نفسك الأول.",
        action: "اكتب الموقف في جملة واحدة — بس متعيشوش تاني.",
        theme: "defend",
        icon: "🛡️"
      };
    }
    return {
      title: "مواجهة الموقف",
      message: "عندك طاقة كافية تتعامل مع الموقف. ركّز على النقطة الأهم.",
      action: "حدّد حاجة واحدة تقدر تغيّرها في الموقف ده.",
      theme: "attack",
      icon: "🎯"
    };
  }

  // 3. Thought focus
  if (focus === "thought") {
    return {
      title: "فحص الأفكار",
      message: "الفكرة المتكررة دي بتحاول تاخد انتباهك. خلّينا نفحصها بهدوء.",
      action: "اسأل نفسك: الفكرة دي حقيقية ولا مجرد خوف؟",
      theme: "defend",
      icon: "🔍"
    };
  }

  // 4. High energy — no specific focus
  if (energy >= 7) {
    return {
      title: "انطلاق سريع",
      message: "طاقتك عالية — استغلّها دلوقتي قبل ما تقل.",
      action: "ابدأ أصعب حاجة في قايمتك الآن.",
      theme: "attack",
      icon: "🚀"
    };
  }

  return {
    title: "تقدّم ثابت",
    message: "إنت في حالة متوازنة. كمّل بنفس الإيقاع — خطوة خطوة.",
    action: "اختار مهمة واحدة صغيرة ونفّذها.",
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
