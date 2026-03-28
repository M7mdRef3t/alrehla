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
  if (energy == null) return "مش باينة";
  if (energy <= 2) return "واقعة خالص";
  if (energy <= 4) return "نازلة";
  if (energy <= 6) return "نص نص";
  if (energy <= 8) return "عالية";
  return "في العالي";
}

/**
 * Short hint text based on energy
 */
export function getEnergyQuickHint(energy: number | null): string {
  if (energy == null) return "اختار اللي حاسه";
  if (energy <= 2) return "محتاج أفصل";
  if (energy <= 4) return "هادي سيكا";
  if (energy <= 6) return "مظبوط";
  if (energy <= 8) return "يلا بينا";
  return "وحش بجد";
}

/**
 * Short hint text based on mood
 */
export function getMoodQuickHint(mood: PulseMood | null): string {
  if (!mood) return "قولي حاسس بإيه دلوقتي؟";
  switch (mood) {
    case "bright":
      return "استغل الروقان وخد خطوة.";
    case "calm":
      return "زي الفل، خليك هادي زي ما إنت.";
    case "tense":
      return "خد نفس عميق قبل أي حاجة.";
    case "hopeful":
      return "خلي الحماس ده يتحول لفعل.";
    case "anxious":
      return "خطوة واحدة صغيرة كفاية دلوقتي.";
    case "angry":
      return "فجّر طاقتك في شغل مفيد.";
    case "sad":
      return "معلش، خليك حنين على نفسك.";
    case "overwhelmed":
      return "بسطها خالص: حاجة واحدة بس.";
    default:
      return "قولي حاسس بإيه دلوقتي؟";
  }
}

/**
 * Short hint text based on focus
 */
export function getFocusQuickHint(focus: PulseFocus | null, isStartRecovery: boolean): string {
  if (!focus) return "ناوي تركز على إيه؟";
  if (focus === "event") return "الموقف اللي حصل.. فكك منه شوية.";
  if (focus === "thought") return "الفكرة دي شاغلة بالك ليه؟";
  if (focus === "body") return "جسمك محتاج تفصل وتهدى.";
  return isStartRecovery
    ? "ابدأ من هنا.. استكشف بهدوء."
    : "كمل طريقك.. الخطوة اللي جاية.";
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
        title: "وضع الصيانة",
        message: "جسمك بيقولك كفاية كده.. محتاج تفصل وتشحن بطاريتك.",
        action: "افصل 10 دقائق 'نفس' وبعدين قرر.",
        theme: "recover",
        icon: "🔋"
      };
    }
    return {
      title: "دلع نفسك",
      message: "جسمك تمام.. بس محتاج حركة بسيطة تظبط الأداء.",
      action: "قوم اتحرك دقيقتين أو اشرب مية.",
      theme: "recover",
      icon: "🧘"
    };
  }

  // 2. Event focus
  if (focus === "event") {
    if (energy <= 4) {
      return {
        title: "حائط صد",
        message: "الموقف ده خد من طاقتك كتير.. متخليش حاجة تاني تسحبك.",
        action: "اكتب اللي حصل في جملة.. وانساه دلوقتي.",
        theme: "defend",
        icon: "🛡️"
      };
    }
    return {
      title: "اشتباك مباشر",
      message: "بما إن طاقتك كويسة.. خلص اللي وراك في الموقف ده.",
      action: "حدد أهم حاجة تقدر تعملها دلوقتي.",
      theme: "attack",
      icon: "🎯"
    };
  }

  // 3. Thought focus
  if (focus === "thought") {
    return {
      title: "فلتر دماغك",
      message: "الفكرة دي بقالها كتير.. خلونا نشوف شاغلة بالك ليه.",
      action: "اسأل نفسك: الكلام ده بجد ولا فكك؟",
      theme: "defend",
      icon: "🔍"
    };
  }

  // 4. High energy — no specific focus
  if (energy >= 7) {
    return {
      title: "هجوم كاسح",
      message: "طاقتك في العالي.. استغلها قبل ما تهبط.",
      action: "ابدأ بأتقل حاجة في لستتك دلوقتي.",
      theme: "attack",
      icon: "🚀"
    };
  }

  return {
    title: "خطوات ثابتة",
    message: "إنت في المظبوط.. كمل بنفس النفس الهادي.",
    action: "نقي حاجة بسيطة وخلصها.",
    theme: "defend",
    icon: "📍"
  };
}

/**
 * Gets a short message for post-save analytics
 */
export function getPostSaveAction(energy: number): string {
  if (energy <= 3) return "شغلنا وضع الصيانة";
  if (energy <= 6) return "ضبطنا البوصلة";
  return "الطيار الآلي جاهز";
}
